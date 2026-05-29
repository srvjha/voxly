import { and, desc, eq, inArray, sql } from "drizzle-orm";
import geoip from "geoip-lite";
import { clerkClient } from "@clerk/express";
import { db } from "../../db/index.js";
import {
  options,
  pollResponses,
  polls,
  questionAnswers,
  questions,
  users,
} from "../../db/schema.js";
import { HttpError } from "../../http-error.js";
import { broadcastPollUpdate } from "../../realtime/io.js";
import type {
  CreatePollInput,
  SubmitResponseInput,
  UpdatePollInput,
} from "./polls.schema.js";

const COUNTRY_NAMES: Record<string, string> = {
  IN: "India", US: "United States", GB: "United Kingdom", CA: "Canada",
  AU: "Australia", DE: "Germany", FR: "France", ES: "Spain", IT: "Italy",
  NL: "Netherlands", BR: "Brazil", MX: "Mexico", AR: "Argentina", JP: "Japan",
  KR: "South Korea", CN: "China", SG: "Singapore", MY: "Malaysia", PH: "Philippines",
  ID: "Indonesia", TH: "Thailand", VN: "Vietnam", PK: "Pakistan", BD: "Bangladesh",
  LK: "Sri Lanka", NP: "Nepal", AE: "United Arab Emirates", SA: "Saudi Arabia",
  IL: "Israel", TR: "Turkey", EG: "Egypt", ZA: "South Africa", NG: "Nigeria",
  KE: "Kenya", RU: "Russia", UA: "Ukraine", PL: "Poland", SE: "Sweden",
  NO: "Norway", FI: "Finland", DK: "Denmark", IE: "Ireland", PT: "Portugal",
  CH: "Switzerland", AT: "Austria", BE: "Belgium", GR: "Greece", CZ: "Czechia",
  RO: "Romania", HU: "Hungary", NZ: "New Zealand",
};

function normalizeIp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const ip = raw.trim();
  if (!ip) return null;
  // X-Forwarded-For style: first entry is the client
  const first = ip.split(",")[0]!.trim();
  // IPv4-mapped IPv6 prefix (::ffff:1.2.3.4)
  if (first.startsWith("::ffff:")) return first.slice(7);
  return first;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip.startsWith("fc") || // IPv6 unique-local
    ip.startsWith("fd") ||
    ip.startsWith("fe80:")
  );
}

function lookupCountry(rawIp: string | null | undefined): string | null {
  const ip = normalizeIp(rawIp);
  if (!ip) return null;
  if (isPrivateIp(ip)) return null;
  const hit = geoip.lookup(ip);
  return hit?.country ?? null;
}

async function countryFromClerk(clerkId: string): Promise<string | null> {
  try {
    const resp = (await clerkClient.sessions.getSessionList({
      userId: clerkId,
    })) as unknown;

    const sessions: Array<{
      lastActiveAt?: number;
      latestActivity?: { country?: string };
    }> = Array.isArray(resp)
      ? (resp as Array<{ lastActiveAt?: number; latestActivity?: { country?: string } }>)
      : ((resp as { data?: unknown }).data as Array<{
          lastActiveAt?: number;
          latestActivity?: { country?: string };
        }>) ?? [];

    if (!sessions.length) return null;

    const sorted = [...sessions].sort(
      (a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0),
    );
    const country = sorted[0]?.latestActivity?.country;
    return country ? country.toUpperCase() : null;
  } catch {
    return null;
  }
}

type PollRow = typeof polls.$inferSelect;
type QuestionRow = typeof questions.$inferSelect;
type OptionRow = typeof options.$inferSelect;

export type PollWithStructure = PollRow & {
  questions: (QuestionRow & { options: OptionRow[] })[];
};

async function loadPollFull(pollId: string): Promise<PollWithStructure | null> {
  const pollRow = (
    await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
  )[0];
  if (!pollRow) return null;

  const qs = await db
    .select()
    .from(questions)
    .where(eq(questions.pollId, pollId))
    .orderBy(questions.orderIndex);

  if (qs.length === 0) {
    return { ...pollRow, questions: [] };
  }

  const opts = await db
    .select()
    .from(options)
    .where(
      inArray(
        options.questionId,
        qs.map((q) => q.id),
      ),
    )
    .orderBy(options.orderIndex);

  const optsByQ = new Map<string, OptionRow[]>();
  for (const o of opts) {
    const arr = optsByQ.get(o.questionId) ?? [];
    arr.push(o);
    optsByQ.set(o.questionId, arr);
  }

  return {
    ...pollRow,
    questions: qs.map((q) => ({ ...q, options: optsByQ.get(q.id) ?? [] })),
  };
}

async function maybeExpire(poll: PollRow): Promise<PollRow> {
  if (
    poll.status === "active" &&
    poll.expiresAt &&
    poll.expiresAt.getTime() < Date.now()
  ) {
    await db
      .update(polls)
      .set({ status: "expired" })
      .where(eq(polls.id, poll.id));
    return { ...poll, status: "expired" };
  }
  return poll;
}

async function ensureCreatorAndEditable(pollId: string, creatorId: string) {
  const poll = (
    await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
  )[0];
  if (!poll) throw new HttpError(404, "Poll not found");
  if (poll.creatorId !== creatorId)
    throw new HttpError(403, "Not the poll creator");
  if (poll.status !== "draft")
    throw new HttpError(409, "Poll is no longer editable");

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pollResponses)
    .where(eq(pollResponses.pollId, pollId));
  if ((countRow?.count ?? 0) > 0)
    throw new HttpError(409, "Poll already has responses");

  return poll;
}

async function insertQuestionsTree(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  pollId: string,
  inputQuestions: CreatePollInput["questions"],
) {
  for (const [qIdx, q] of inputQuestions.entries()) {
    const [questionRow] = await tx
      .insert(questions)
      .values({
        pollId,
        text: q.text,
        isMandatory: q.isMandatory,
        orderIndex: qIdx,
      })
      .returning();

    if (!questionRow) throw new HttpError(500, "Failed to insert question");

    await tx.insert(options).values(
      q.options.map((o, oIdx) => ({
        questionId: questionRow.id,
        text: o.text,
        orderIndex: oIdx,
      })),
    );
  }
}

export async function createPoll(creatorId: string, input: CreatePollInput) {
  const pollId = await db.transaction(async (tx) => {
    const [pollRow] = await tx
      .insert(polls)
      .values({
        creatorId,
        title: input.title,
        description: input.description ?? null,
        isAnonymous: input.isAnonymous,
        expiresAt: new Date(input.expiresAt),
      })
      .returning();

    if (!pollRow) throw new HttpError(500, "Failed to create poll");

    await insertQuestionsTree(tx, pollRow.id, input.questions);
    return pollRow.id;
  });

  const full = await loadPollFull(pollId);
  if (!full) throw new HttpError(500, "Poll vanished after create");
  return full;
}

export async function updatePoll(
  pollId: string,
  creatorId: string,
  input: UpdatePollInput,
) {
  await ensureCreatorAndEditable(pollId, creatorId);

  await db.transaction(async (tx) => {
    await tx.delete(questions).where(eq(questions.pollId, pollId));

    await tx
      .update(polls)
      .set({
        title: input.title,
        description: input.description ?? null,
        isAnonymous: input.isAnonymous,
        expiresAt: new Date(input.expiresAt),
        updatedAt: new Date(),
      })
      .where(eq(polls.id, pollId));

    await insertQuestionsTree(tx, pollId, input.questions);
  });

  const full = await loadPollFull(pollId);
  if (!full) throw new HttpError(500, "Poll vanished after update");
  return full;
}

export async function listMyPolls(creatorId: string) {
  const rows = await db
    .select({
      poll: polls,
      responseCount: sql<number>`(SELECT count(*)::int FROM ${pollResponses} WHERE ${pollResponses.pollId} = ${polls.id})`,
    })
    .from(polls)
    .where(eq(polls.creatorId, creatorId))
    .orderBy(desc(polls.createdAt));

  return rows.map((r) => ({ ...r.poll, responseCount: r.responseCount }));
}

export async function listParticipatedPolls(respondentId: string) {
  const rows = await db
    .select({
      poll: polls,
      submittedAt: pollResponses.submittedAt,
      responseCount: sql<number>`(SELECT count(*)::int FROM ${pollResponses} pr2 WHERE pr2.poll_id = ${polls.id})`,
    })
    .from(pollResponses)
    .innerJoin(polls, eq(polls.id, pollResponses.pollId))
    .where(eq(pollResponses.respondentId, respondentId))
    .orderBy(desc(pollResponses.submittedAt));

  // De-duplicate (one response per poll already enforced for signed-in, but be safe)
  const seen = new Set<string>();
  const out: Array<typeof rows[number]["poll"] & {
    responseCount: number;
    submittedAt: Date;
  }> = [];
  for (const r of rows) {
    if (seen.has(r.poll.id)) continue;
    seen.add(r.poll.id);
    out.push({
      ...r.poll,
      responseCount: r.responseCount,
      submittedAt: r.submittedAt,
    });
  }
  return out;
}

export async function getPoll(
  pollId: string,
  viewerDbUserId: string | null,
) {
  const full = await loadPollFull(pollId);
  if (!full) throw new HttpError(404, "Poll not found");

  const expired = await maybeExpire(full);
  const status = expired.status;
  const isCreator = viewerDbUserId !== null && viewerDbUserId === full.creatorId;

  if (status === "draft" && !isCreator) {
    throw new HttpError(404, "Poll not found");
  }
  if (status === "expired" && !isCreator) {
    throw new HttpError(410, "Poll has expired");
  }

  if (status === "published") {
    const tallies = await computeTallies(pollId, full);
    return { ...full, status, tallies };
  }

  return { ...full, status };
}

export async function activatePoll(pollId: string, creatorId: string) {
  const poll = (
    await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
  )[0];
  if (!poll) throw new HttpError(404, "Poll not found");
  if (poll.creatorId !== creatorId)
    throw new HttpError(403, "Not the poll creator");
  if (poll.status !== "draft")
    throw new HttpError(409, "Only draft polls can be activated");
  if (poll.expiresAt && poll.expiresAt.getTime() <= Date.now())
    throw new HttpError(400, "expiresAt is in the past");

  await db
    .update(polls)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(polls.id, pollId));

  return loadPollFull(pollId);
}

export async function publishPoll(pollId: string, creatorId: string) {
  const poll = (
    await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
  )[0];
  if (!poll) throw new HttpError(404, "Poll not found");
  if (poll.creatorId !== creatorId)
    throw new HttpError(403, "Not the poll creator");
  if (poll.status !== "active" && poll.status !== "expired") {
    throw new HttpError(409, "Only active or expired polls can be published");
  }

  await db
    .update(polls)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(polls.id, pollId));

  return loadPollFull(pollId);
}

export async function deletePoll(pollId: string, creatorId: string) {
  const poll = (
    await db.select().from(polls).where(eq(polls.id, pollId)).limit(1)
  )[0];
  if (!poll) throw new HttpError(404, "Poll not found");
  if (poll.creatorId !== creatorId)
    throw new HttpError(403, "Not the poll creator");

  await db.delete(polls).where(eq(polls.id, pollId));
}

export async function submitResponse(
  pollId: string,
  payload: SubmitResponseInput,
  viewer: { id: string } | null,
  ipAddress: string | null,
) {
  const full = await loadPollFull(pollId);
  if (!full) throw new HttpError(404, "Poll not found");

  const expired = await maybeExpire(full);
  if (expired.status !== "active") {
    throw new HttpError(410, `Poll is ${expired.status}; not accepting responses`);
  }

  let respondentId: string | null = null;
  let anonToken: string | null = null;

  if (full.isAnonymous) {
    if (!payload.anonToken) {
      throw new HttpError(400, "anonToken is required for anonymous polls");
    }
    anonToken = payload.anonToken;
  } else {
    if (!viewer) {
      throw new HttpError(401, "Authentication required for this poll");
    }
    respondentId = viewer.id;
  }

  const questionMap = new Map(full.questions.map((q) => [q.id, q]));
  for (const a of payload.answers) {
    const q = questionMap.get(a.questionId);
    if (!q)
      throw new HttpError(400, `questionId ${a.questionId} not part of poll`);
    if (!q.options.some((o) => o.id === a.optionId)) {
      throw new HttpError(
        400,
        `optionId ${a.optionId} not part of question ${a.questionId}`,
      );
    }
  }

  const answered = new Set(payload.answers.map((a) => a.questionId));
  for (const q of full.questions) {
    if (q.isMandatory && !answered.has(q.id)) {
      throw new HttpError(400, `Missing answer for mandatory question ${q.id}`);
    }
  }

  try {
    const resp = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(pollResponses)
        .values({
          pollId,
          respondentId,
          anonToken,
          ipAddress,
        })
        .returning();

      if (!inserted) throw new HttpError(500, "Failed to insert response");

      await tx.insert(questionAnswers).values(
        payload.answers.map((a) => ({
          responseId: inserted.id,
          questionId: a.questionId,
          optionId: a.optionId,
        })),
      );

      return inserted;
    });

    broadcastPollUpdate(pollId);
    return resp;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "23505") {
      throw new HttpError(409, "You have already responded to this poll");
    }
    throw err;
  }
}

async function computeTallies(pollId: string, full: PollWithStructure) {
  const [totalRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(pollResponses)
    .where(eq(pollResponses.pollId, pollId));
  const totalResponses = totalRow?.total ?? 0;

  const rows = await db
    .select({
      optionId: questionAnswers.optionId,
      count: sql<number>`count(*)::int`,
    })
    .from(questionAnswers)
    .innerJoin(
      pollResponses,
      eq(pollResponses.id, questionAnswers.responseId),
    )
    .where(eq(pollResponses.pollId, pollId))
    .groupBy(questionAnswers.optionId);

  const countByOption = new Map<string, number>();
  for (const r of rows) countByOption.set(r.optionId, r.count);

  const questionsOut = full.questions.map((q) => {
    const optionsOut = q.options.map((o) => ({
      optionId: o.id,
      text: o.text,
      count: countByOption.get(o.id) ?? 0,
    }));
    const questionTotal = optionsOut.reduce((s, o) => s + o.count, 0);
    return {
      questionId: q.id,
      text: q.text,
      totalAnswers: questionTotal,
      options: optionsOut.map((o) => ({
        ...o,
        percentage:
          questionTotal > 0
            ? Math.round((o.count / questionTotal) * 1000) / 10
            : 0,
      })),
    };
  });

  const respRows = await db
    .select({
      ipAddress: pollResponses.ipAddress,
      respondentId: pollResponses.respondentId,
    })
    .from(pollResponses)
    .where(eq(pollResponses.pollId, pollId));

  const respondentIds = Array.from(
    new Set(
      respRows.map((r) => r.respondentId).filter((v): v is string => !!v),
    ),
  );

  const clerkIdByUserId = new Map<string, string>();
  if (respondentIds.length > 0) {
    const userRows = await db
      .select({ id: users.id, clerkId: users.clerkId })
      .from(users)
      .where(inArray(users.id, respondentIds));
    for (const u of userRows) clerkIdByUserId.set(u.id, u.clerkId);
  }

  const clerkCountryCache = new Map<string, string | null>();
  async function clerkCountryFor(userId: string): Promise<string | null> {
    const clerkId = clerkIdByUserId.get(userId);
    if (!clerkId) return null;
    if (clerkCountryCache.has(clerkId)) return clerkCountryCache.get(clerkId)!;
    const c = await countryFromClerk(clerkId);
    clerkCountryCache.set(clerkId, c);
    return c;
  }

  const countryCounts = new Map<string, number>();
  let unknown = 0;
  for (const r of respRows) {
    let code: string | null = null;
    if (r.respondentId) {
      code = await clerkCountryFor(r.respondentId);
    }
    if (!code) code = lookupCountry(r.ipAddress);
    if (!code) {
      unknown += 1;
      continue;
    }
    countryCounts.set(code, (countryCounts.get(code) ?? 0) + 1);
  }

  const regionsResolved = Array.from(countryCounts.entries())
    .map(([code, count]) => ({
      country: code,
      name: COUNTRY_NAMES[code] ?? code,
      count,
      percentage:
        totalResponses > 0
          ? Math.round((count / totalResponses) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const regions = unknown > 0
    ? [
        ...regionsResolved,
        {
          country: "ZZ",
          name: "Unknown",
          count: unknown,
          percentage:
            totalResponses > 0
              ? Math.round((unknown / totalResponses) * 1000) / 10
              : 0,
        },
      ]
    : regionsResolved;

  return { totalResponses, questions: questionsOut, regions };
}

export interface VoterResponse {
  responseId: string;
  userName: string | null;
  userEmail: string;
  submittedAt: Date;
  answers: Array<{
    questionId: string;
    optionId: string;
  }>;
}

export async function getAnalytics(pollId: string, creatorId: string) {
  const full = await loadPollFull(pollId);
  if (!full) throw new HttpError(404, "Poll not found");
  if (full.creatorId !== creatorId)
    throw new HttpError(403, "Not the poll creator");

  const tallies = await computeTallies(pollId, full);

  let voterResponses: VoterResponse[] | undefined = undefined;

  if (!full.isAnonymous) {
    const responsesWithAnswers = await db
      .select({
        responseId: pollResponses.id,
        submittedAt: pollResponses.submittedAt,
        userName: users.name,
        userEmail: users.email,
        questionId: questionAnswers.questionId,
        optionId: questionAnswers.optionId,
      })
      .from(pollResponses)
      .innerJoin(users, eq(pollResponses.respondentId, users.id))
      .innerJoin(
        questionAnswers,
        eq(questionAnswers.responseId, pollResponses.id),
      )
      .where(eq(pollResponses.pollId, pollId));

    const voterMap = new Map<string, VoterResponse>();

    for (const row of responsesWithAnswers) {
      if (!voterMap.has(row.responseId)) {
        voterMap.set(row.responseId, {
          responseId: row.responseId,
          userName: row.userName,
          userEmail: row.userEmail,
          submittedAt: row.submittedAt,
          answers: [],
        });
      }
      voterMap.get(row.responseId)!.answers.push({
        questionId: row.questionId,
        optionId: row.optionId,
      });
    }

    voterResponses = Array.from(voterMap.values());
  }

  return {
    pollId,
    status: full.status,
    isAnonymous: full.isAnonymous,
    ...tallies,
    voterResponses,
  };
}

export { loadPollFull };
