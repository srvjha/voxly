import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useParams } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
} from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApi, ApiError } from "@/lib/api";
import { getAnonToken, hasSubmitted, markSubmitted } from "@/lib/anonToken";
import type { Poll, PollTallyQuestion } from "@/types";
import {
  EyeOff,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Radio,
  Lock,
  Asterisk,
} from "lucide-react";

function useCountdown(iso: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!iso) return;
    const i = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(i);
  }, [iso]);

  return useMemo(() => {
    if (!iso) return null;
    const target = new Date(iso).getTime();
    const diff = target - now;
    if (Number.isNaN(target)) return null;
    if (diff <= 0) return { label: "Closed", expired: true };
    const d = Math.floor(diff / 86_400_000);
    const h = Math.floor((diff % 86_400_000) / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    let label = "";
    if (d > 0) label = `${d}d ${h}h left`;
    else if (h > 0) label = `${h}h ${m}m left`;
    else label = `${Math.max(1, m)}m left`;
    return { label, expired: false };
  }, [iso, now]);
}

function ResultBars({ questions }: { questions: PollTallyQuestion[] }) {
  return (
    <div className="space-y-6 stagger-children">
      {questions.map((q, qIdx) => {
        const maxCount = Math.max(...q.options.map((o) => o.count), 0);
        return (
          <div key={q.questionId} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-foreground leading-snug">
                <span className="font-mono text-xs text-muted-foreground mr-2">
                  Q{qIdx + 1}
                </span>
                {q.text}
              </div>
              <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                {q.totalAnswers} response{q.totalAnswers === 1 ? "" : "s"}
              </span>
            </div>
            <div className="space-y-2 pt-1">
              {q.options.map((o, oIdx) => {
                const leader = o.count > 0 && o.count === maxCount;
                return (
                  <div key={o.optionId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-elevated border border-border font-mono text-[10px] text-muted-foreground">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="truncate text-foreground/90">
                          {o.text}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                        <span
                          className={
                            leader
                              ? "font-semibold text-foreground"
                              : undefined
                          }
                        >
                          {o.count}
                        </span>{" "}
                        · {o.percentage}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-elevated overflow-hidden">
                      <div
                        className={`h-full rounded-full animate-bar-fill ${
                          leader
                            ? "bg-gradient-to-r from-primary to-accent"
                            : "bg-primary/70"
                        }`}
                        style={
                          {
                            "--fill-width": `${o.percentage}%`,
                          } as CSSProperties
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function PollPublic() {
  const { id } = useParams();
  const api = useApi();
  const { isSignedIn } = useAuth();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const countdown = useCountdown(poll?.expiresAt);

  async function load() {
    if (!id) return;
    setError(null);
    setErrorStatus(null);
    try {
      const { poll } = await api.getPoll(id);
      setPoll(poll);
      if (hasSubmitted(poll.id)) setSubmitted(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setErrorStatus(e.status);
      } else {
        setError("Failed to load poll");
      }
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSubmit() {
    if (!poll) return;
    setError(null);
    for (const q of poll.questions) {
      if (q.isMandatory && !answers[q.id]) {
        setError(`Please answer: ${q.text}`);
        return;
      }
    }
    const payload = {
      anonToken: poll.isAnonymous ? getAnonToken() : undefined,
      answers: Object.entries(answers).map(([questionId, optionId]) => ({
        questionId,
        optionId,
      })),
    };
    setSubmitting(true);
    try {
      await api.submitResponse(poll.id, payload);
      markSubmitted(poll.id);
      setSubmitted(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        markSubmitted(poll.id);
        setSubmitted(true);
      } else {
        setError(e instanceof ApiError ? e.message : "Failed to submit");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Error state ─────────────────────────────────────── */
  if (error && !poll) {
    const title =
      errorStatus === 404
        ? "Poll not found"
        : errorStatus === 410
          ? "Poll closed"
          : "Couldn't load poll";
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="pt-2">{title}</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  if (!poll) return <div className="text-muted-foreground">Loading…</div>;

  /* ── Published results view ───────────────────────────── */
  if (poll.status === "published" && poll.tallies) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 flex items-center gap-3">
          <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-foreground">
              Results are final.
            </span>{" "}
            <span className="text-muted-foreground">
              This poll is closed.
            </span>
          </div>
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {poll.title}
          </h1>
          {poll.description && (
            <p className="text-muted-foreground text-sm mt-1.5 max-w-prose">
              {poll.description}
            </p>
          )}
          <div className="text-sm text-muted-foreground mt-3 font-mono">
            {poll.tallies.totalResponses} total response
            {poll.tallies.totalResponses === 1 ? "" : "s"}
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <ResultBars questions={poll.tallies.questions} />
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Thank you state ──────────────────────────────────── */
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto">
        <Card className="text-center">
          <CardContent className="pt-12 pb-12 space-y-4">
            <div className="relative inline-flex items-center justify-center mx-auto">
              <span
                className="absolute inset-0 rounded-full bg-success/20 animate-live-pulse"
                aria-hidden="true"
              />
              <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-success text-white shadow-lg">
                <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
              </div>
            </div>
            <div className="space-y-1.5 pt-2">
              <h1 className="font-display text-2xl font-bold tracking-tight">
                Thanks for responding!
              </h1>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Your response was recorded. The creator will publish the
                results when the poll closes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Inactive state ───────────────────────────────────── */
  if (poll.status !== "active") {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Poll not accepting responses</CardTitle>
            <CardDescription>
              Current status:{" "}
              <span className="capitalize font-medium">{poll.status}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  /* ── Auth-required gate ───────────────────────────────── */
  if (!poll.isAnonymous && !isSignedIn) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardHeader>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="pt-2">{poll.title}</CardTitle>
            <CardDescription>
              This poll requires you to be signed in to respond.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignedOut>
              <SignInButton mode="modal">
                <Button>Sign in to respond</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Button onClick={() => load()}>Continue</Button>
            </SignedIn>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Active response form ─────────────────────────────── */
  const mandatoryIds = poll.questions.filter((q) => q.isMandatory).map((q) => q.id);
  const allRequiredAnswered = mandatoryIds.every((qid) => Boolean(answers[qid]));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/12 text-accent-600 dark:text-accent-300 border border-accent/25 px-2.5 py-0.5 font-medium">
            <Radio className="h-3 w-3" /> Live poll
          </span>
          {poll.isAnonymous ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated text-muted-foreground border border-border px-2.5 py-0.5 font-medium">
              <EyeOff className="h-3 w-3" /> Anonymous
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 font-medium">
              <ShieldCheck className="h-3 w-3" /> Signed-in
            </span>
          )}
          {countdown && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/12 text-amber-700 dark:text-warning border border-warning/30 px-2.5 py-0.5 font-medium">
              <Clock className="h-3 w-3" /> {countdown.label}
            </span>
          )}
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          {poll.title}
        </h1>
        {poll.description && (
          <p className="text-muted-foreground text-base leading-relaxed max-w-prose">
            {poll.description}
          </p>
        )}
        {poll.isAnonymous && (
          <p className="text-xs text-muted-foreground pt-1">
            Your identity is not recorded.
          </p>
        )}
      </div>

      {/* Questions */}
      <div className="space-y-4 stagger-children">
        {poll.questions.map((q, idx) => (
          <Card key={q.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base leading-snug flex items-start gap-2">
                <span className="font-mono text-xs text-muted-foreground pt-1">
                  Q{idx + 1}
                </span>
                <span className="flex-1">
                  {q.text}
                  {q.isMandatory && (
                    <Asterisk
                      className="inline-block h-3 w-3 ml-1 text-destructive align-top"
                      aria-label="Required"
                    />
                  )}
                  {!q.isMandatory && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (optional)
                    </span>
                  )}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.map((o, oIdx) => {
                const selected = answers[q.id] === o.id;
                return (
                  <label
                    key={o.id}
                    className={`flex items-center gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                      selected
                        ? "border-primary bg-primary/8 shadow-brand"
                        : "border-border bg-surface hover:bg-elevated hover:border-border-strong"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={selected}
                      onChange={() =>
                        setAnswers((a) => ({ ...a, [q.id]: o.id }))
                      }
                      className="accent-primary h-4 w-4"
                    />
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-elevated border border-border font-mono text-[11px] text-muted-foreground">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-sm text-foreground/90 flex-1">
                      {o.text}
                    </span>
                    {selected && (
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/95 backdrop-blur p-3 shadow-lg">
        <div className="text-xs text-muted-foreground pl-2">
          {allRequiredAnswered ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="h-4 w-4" /> Ready to submit
            </span>
          ) : (
            <>
              <Asterisk className="inline h-3 w-3 text-destructive" /> Answer
              all required questions
            </>
          )}
        </div>
        <Button
          onClick={onSubmit}
          disabled={submitting || !allRequiredAnswered}
          size="lg"
        >
          {submitting ? "Submitting…" : "Submit response"}
        </Button>
      </div>
    </div>
  );
}
