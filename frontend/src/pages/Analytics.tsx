import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { useApi, ApiError } from "@/lib/api";
import { usePollRoom } from "@/lib/socket";
import { useThemeStore } from "@/stores/theme";
import type {
  Analytics as AnalyticsT,
  PollRegionTally,
  PollTallyQuestion,
} from "@/types";
import {
  RefreshCw,
  ArrowLeft,
  BarChart3,
  Users,
  CheckCircle2,
  Sparkles,
  Trophy,
  TrendingDown,
  AlertCircle,
  Globe2,
  Lock,
  Search,
} from "lucide-react";


const cardSurface = [
  "bg-white border-orange-200/60 shadow-[0_4px_14px_-4px_rgba(249,115,22,0.10),0_2px_4px_-2px_rgba(15,14,46,0.06)]",
  "dark:bg-[#080626] dark:border-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
].join(" ");

const PALETTE = [
  "#F97316",
  "#818CF8",
  "#22D3EE",
  "#FB923C",
  "#A5B4FC",
  "#34D399",
  "#F472B6",
  "#FBBF24",
];

export function Analytics() {
  const { id } = useParams();
  const api = useApi();
  const isDark = useThemeStore((s) => s.resolved === "dark");
  const [data, setData] = useState<AnalyticsT | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!id) return;
    setRefreshing(true);
    try {
      const { analytics } = await api.getAnalytics(id);
      setData(analytics);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load analytics");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  usePollRoom(id, load);

  const isLive = data?.status === "active";

  const completionRate = useMemo(() => {
    if (!data || data.questions.length === 0 || data.totalResponses === 0)
      return 0;
    const answered = data.questions.filter((q) => q.totalAnswers > 0);
    if (answered.length === 0) return 0;
    const avg =
      answered.reduce(
        (sum, q) => sum + q.totalAnswers / data.totalResponses,
        0,
      ) / answered.length;
    return Math.round(avg * 100);
  }, [data]);

  const totalVotes = useMemo(() => {
    if (!data) return 0;
    return data.questions.reduce(
      (sum, q) => sum + q.options.reduce((s, o) => s + o.count, 0),
      0,
    );
  }, [data]);

  const topQuestion = useMemo<PollTallyQuestion | null>(() => {
    if (!data || data.questions.length === 0) return null;
    return data.questions.reduce(
      (best, q) => (q.totalAnswers > best.totalAnswers ? q : best),
      data.questions[0],
    );
  }, [data]);

  const insights = useMemo(() => {
    if (!data || data.questions.length === 0) return [];
    const list: Array<{ icon: typeof Trophy; tone: string; text: string }> = [];

    let bestOpt: {
      qText: string;
      oText: string;
      pct: number;
    } | null = null;
    for (const q of data.questions) {
      for (const o of q.options) {
        if (!bestOpt || o.percentage > bestOpt.pct) {
          bestOpt = { qText: q.text, oText: o.text, pct: o.percentage };
        }
      }
    }
    if (bestOpt && bestOpt.pct > 0) {
      list.push({
        icon: Trophy,
        tone: "text-orange-500",
        text: `“${bestOpt.oText}” leads with ${bestOpt.pct}% in “${bestOpt.qText}”.`,
      });
    }

    const mostAnswered = data.questions.reduce(
      (best, q) => (q.totalAnswers > best.totalAnswers ? q : best),
      data.questions[0],
    );
    if (mostAnswered.totalAnswers > 0) {
      list.push({
        icon: Sparkles,
        tone: "text-blue-400",
        text: `“${mostAnswered.text}” has the highest engagement (${mostAnswered.totalAnswers} answers).`,
      });
    }

    const leastAnswered = data.questions.reduce(
      (worst, q) => (q.totalAnswers < worst.totalAnswers ? q : worst),
      data.questions[0],
    );
    if (
      leastAnswered.questionId !== mostAnswered.questionId &&
      leastAnswered.totalAnswers < data.totalResponses
    ) {
      list.push({
        icon: TrendingDown,
        tone: "text-warning",
        text: `${data.totalResponses - leastAnswered.totalAnswers} respondents skipped “${leastAnswered.text}”.`,
      });
    }

    return list;
  }, [data]);

  if (error)
    return (
      <Card className={`border-destructive/30 ${cardSurface}`}>
        <CardContent className="pt-6 text-destructive text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          {error}
        </CardContent>
      </Card>
    );
  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="font-mono text-xs uppercase tracking-wider text-accent-600 dark:text-accent-400 mb-1.5">
            Analytics
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              Live results
            </h1>
            <StatusBadge status={data.status} withDot />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time tallies push the moment a response lands.
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {isLive && (
            <span className="inline-flex items-center gap-1.5 text-xs text-orange-500 font-medium">
              <span className="live-dot" aria-hidden="true" />
              Updating live
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Link to={`/polls/${id}/manage`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI
          label="Total Responses"
          value={data.totalResponses.toLocaleString()}
          icon={Users}
          accent="orange"
        />
        <KPI
          label="Status"
          value={isLive ? "LIVE" : data.status.toUpperCase()}
          icon={isLive ? Sparkles : BarChart3}
          accent={isLive ? "orange" : "neutral"}
          live={isLive}
        />
        <KPI
          label="Completion"
          value={`${completionRate}%`}
          icon={CheckCircle2}
          accent="success"
        />
        <KPI
          label="Total Votes Cast"
          value={totalVotes.toLocaleString()}
          icon={BarChart3}
          accent="blue"
        />
      </div>

      {data.questions.length === 0 || data.totalResponses === 0 ? (
        <Card className={`border-dashed ${cardSurface}`}>
          <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-60" />
            No responses yet. Share the poll link to start collecting answers.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
            <Card className={cardSurface}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">
                    Question-wise Breakdown
                  </CardTitle>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Top voted options
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-2">
                {data.questions.map((q, qIdx) => (
                  <QuestionBarChart
                    key={q.questionId}
                    question={q}
                    index={qIdx}
                    isDark={isDark}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className={cardSurface}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Top Question Distribution
                </CardTitle>
                {topQuestion && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {topQuestion.text}
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                {topQuestion && topQuestion.totalAnswers > 0 ? (
                  <TopDonut question={topQuestion} isDark={isDark} />
                ) : (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    Waiting for answers…
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {insights.length > 0 && (
            <Card className={cardSurface}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {insights.map((ins, i) => {
                  const Icon = ins.icon;
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-muted/30 dark:bg-white/[0.02] p-3 flex items-start gap-2.5"
                    >
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${ins.tone}`} />
                      <p className="text-sm text-foreground/90 leading-snug">
                        {ins.text}
                      </p>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <RegionalCard
            regions={data.regions}
            totalResponses={data.totalResponses}
            isDark={isDark}
          />

          <VoterBreakdownCard
            analytics={data}
          />
        </>
      )}
    </div>
  );
}

function KPI({
  label,
  value,
  icon: Icon,
  accent,
  live,
}: {
  label: string;
  value: string;
  icon: typeof BarChart3;
  accent: "orange" | "blue" | "success" | "neutral";
  live?: boolean;
}) {
  const tones: Record<typeof accent, { ring: string; iconBg: string; iconColor: string }> = {
    orange: {
      ring: "from-orange-500/30",
      iconBg: "bg-orange-500/10",
      iconColor: "text-orange-500",
    },
    blue: {
      ring: "from-blue-400/30",
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-400",
    },
    success: {
      ring: "from-emerald-500/30",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
    },
    neutral: {
      ring: "from-white/10",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
    },
  };
  const tone = tones[accent];

  return (
    <div
      className={`relative rounded-xl border border-border bg-card p-4 overflow-hidden ${cardSurface}`}
    >
      <div
        className={`absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl bg-gradient-to-br ${tone.ring} to-transparent pointer-events-none`}
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${tone.iconBg}`}
        >
          <Icon className={`h-3.5 w-3.5 ${tone.iconColor}`} />
        </span>
      </div>
      <div className="relative mt-2 flex items-end gap-2">
        <div className="font-display text-3xl font-bold tabular-nums leading-tight text-foreground">
          {value}
        </div>
        {live && (
          <span
            className="inline-flex items-center gap-1 mb-1 rounded-full bg-orange-500/15 text-orange-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
          >
            <span className="live-dot" aria-hidden="true" />
            live
          </span>
        )}
      </div>
    </div>
  );
}

function QuestionBarChart({
  question,
  index,
  isDark,
}: {
  question: PollTallyQuestion;
  index: number;
  isDark: boolean;
}) {
  const chartData = question.options.map((o, oIdx) => ({
    name: o.text,
    label: `${String.fromCharCode(65 + oIdx)} · ${o.text}`,
    count: o.count,
    percentage: o.percentage,
    fill: PALETTE[oIdx % PALETTE.length],
  }));

  const axisColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,14,46,0.65)";
  const gridLine = isDark ? "rgba(255,255,255,0.06)" : "rgba(15,14,46,0.08)";
  const chartHeight = Math.max(140, chartData.length * 40 + 30);

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium text-foreground/90 leading-snug">
          <span className="font-mono text-[10px] text-muted-foreground mr-2">
            Q{index + 1}
          </span>
          {question.text}
        </div>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
          {question.totalAnswers} answer
          {question.totalAnswers === 1 ? "" : "s"}
        </span>
      </div>
      <div
        className="w-full"
        style={{ height: chartHeight }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 0, bottom: 4 }}
            barCategoryGap="22%"
          >
            <XAxis
              type="number"
              hide
              domain={[0, Math.max(...chartData.map((d) => d.count), 1)]}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={180}
              tickLine={false}
              axisLine={{ stroke: gridLine }}
              tick={{ fill: axisColor, fontSize: 12 }}
              interval={0}
            />
            <Tooltip
              cursor={{ fill: gridLine }}
              contentStyle={{
                background: isDark ? "#0D0B35" : "#FFFFFF",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,14,46,0.10)"}`,
                borderRadius: 10,
                fontSize: 12,
              }}
              labelStyle={{ color: isDark ? "#F0EEFF" : "#0F0E2E" }}
              formatter={(_v, _n, item) => {
                const p = item?.payload as {
                  count: number;
                  percentage: number;
                };
                return [`${p.count} (${p.percentage}%)`, "Votes"];
              }}
            />
            <Bar
              dataKey="count"
              radius={[6, 6, 6, 6]}
              label={{
                position: "right",
                fontSize: 11,
                fill: axisColor,
                formatter: (value) => {
                  const v = typeof value === "number" ? value : Number(value) || 0;
                  const total = chartData.reduce((s, d) => s + d.count, 0);
                  const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                  return `${v} · ${pct}%`;
                },
              }}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopDonut({
  question,
  isDark,
}: {
  question: PollTallyQuestion;
  isDark: boolean;
}) {
  const chartData = question.options
    .filter((o) => o.count > 0)
    .map((o, oIdx) => ({
      name: o.text,
      value: o.count,
      pct: o.percentage,
      fill: PALETTE[oIdx % PALETTE.length],
    }));

  if (chartData.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        No votes yet on this question.
      </div>
    );
  }

  const leader = chartData.reduce((best, d) =>
    d.value > best.value ? d : best,
  );

  return (
    <div className="space-y-3">
      <div className="relative h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={84}
              stroke="none"
              paddingAngle={2}
            >
              {chartData.map((d, i) => (
                <Cell key={i} fill={d.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: isDark ? "#0D0B35" : "#FFFFFF",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.10)" : "rgba(15,14,46,0.10)"}`,
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(_v, n, item) => {
                const p = item?.payload as { value: number; pct: number };
                return [`${p.value} (${p.pct}%)`, n as string];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Leading
          </div>
          <div className="font-display text-lg font-bold tabular-nums text-foreground">
            {leader.pct}%
          </div>
          <div className="text-[10px] text-muted-foreground max-w-[110px] truncate text-center">
            {leader.name}
          </div>
        </div>
      </div>

      <ul className="space-y-1.5">
        {chartData.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ background: d.fill }}
            />
            <span className="text-foreground/90 truncate flex-1">{d.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {d.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

void Legend;


function flagFor(code: string): string {
  if (code === "ZZ" || code.length !== 2) return "🌐";
  const upper = code.toUpperCase();
  const A = 0x1f1e6 - 65;
  return (
    String.fromCodePoint(upper.charCodeAt(0) + A) +
    String.fromCodePoint(upper.charCodeAt(1) + A)
  );
}

function RegionalCard({
  regions,
  totalResponses,
  isDark,
}: {
  regions: PollRegionTally[];
  totalResponses: number;
  isDark: boolean;
}) {
  const sorted = [...regions].filter((r) => r.count > 0).sort(
    (a, b) => b.count - a.count,
  );

  if (sorted.length === 0 || totalResponses === 0) {
    return (
      <Card className={`border-dashed ${cardSurface}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-blue-400" />
            Regional Participation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 text-sm text-muted-foreground">
          No region data yet — waiting for responses with resolvable IPs.
        </CardContent>
      </Card>
    );
  }

  const top = sorted.slice(0, 8);
  const max = Math.max(...top.map((r) => r.count));
  const resolved = sorted.filter((r) => r.country !== "ZZ");
  const distinctCountries = resolved.length;

  return (
    <Card className={cardSurface}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-blue-400" />
            Regional Participation
          </CardTitle>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {distinctCountries} countr{distinctCountries === 1 ? "y" : "ies"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-3">
        <ul className="space-y-2">
          {top.map((r) => (
            <li key={r.country} className="flex items-center gap-3">
              <span
                className="text-lg leading-none w-6 shrink-0 text-center"
                aria-hidden="true"
              >
                {flagFor(r.country)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs mb-1 gap-2">
                  <span className="truncate text-foreground/90">{r.name}</span>
                  <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                    <span className="text-foreground font-semibold">
                      {r.count}
                    </span>{" "}
                    · {r.percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-elevated/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
        {sorted.length > top.length && (
          <p
            className="text-[11px] text-muted-foreground/80 pt-1"
            style={{ color: isDark ? undefined : undefined }}
          >
            + {sorted.length - top.length} more
          </p>
        )}
        <p className="text-[11px] text-muted-foreground/70 font-mono pt-1 border-t border-border">
          Country resolved server-side via the respondent's IP (geoip-lite).
          Private/local IPs bucket into Unknown.
        </p>
      </CardContent>
    </Card>
  );
}

function VoterBreakdownCard({
  analytics,
}: {
  analytics: AnalyticsT;
}) {
  const [search, setSearch] = useState("");

  if (analytics.isAnonymous) {
    return (
      <Card className={cardSurface}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-orange-500" />
            Detailed Voter Choices
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2 text-sm text-muted-foreground flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          Voter details are anonymous. This poll is configured to not collect identifying information for voter responses.
        </CardContent>
      </Card>
    );
  }

  const voterResponses = analytics.voterResponses ?? [];

  const filteredResponses = useMemo(() => {
    if (!search.trim()) return voterResponses;
    const term = search.toLowerCase();
    return voterResponses.filter(
      (r) =>
        (r.userName && r.userName.toLowerCase().includes(term)) ||
        r.userEmail.toLowerCase().includes(term)
    );
  }, [voterResponses, search]);

  const questionOptionMap = useMemo(() => {
    const qMap = new Map<string, Map<string, string>>();
    for (const q of analytics.questions) {
      const oMap = new Map<string, string>();
      for (const o of q.options) {
        oMap.set(o.optionId, o.text);
      }
      qMap.set(q.questionId, oMap);
    }
    return qMap;
  }, [analytics.questions]);

  return (
    <Card className={cardSurface}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              Detailed Voter Choices
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              See what option each authenticated respondent voted for.
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {voterResponses.length} Voter{voterResponses.length === 1 ? "" : "s"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 space-y-4">
        {voterResponses.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground border border-dashed border-border rounded-lg">
            No votes recorded yet for this poll.
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by voter name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-muted/20 dark:bg-white/[0.01] border-border max-w-md focus-visible:ring-orange-500"
              />
            </div>

            {filteredResponses.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No voters match "{search}"
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 dark:bg-white/[0.01] text-xs font-semibold text-muted-foreground">
                      <th className="p-3">Voter</th>
                      {analytics.questions.map((q, idx) => (
                        <th key={q.questionId} className="p-3 min-w-[150px]">
                          Q{idx + 1}: {q.text}
                        </th>
                      ))}
                      <th className="p-3 text-right">Voted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-sm">
                    {filteredResponses.map((res) => {
                      const initial = (res.userName || res.userEmail)
                        .charAt(0)
                        .toUpperCase();

                      return (
                        <tr
                          key={res.responseId}
                          className="hover:bg-muted/10 dark:hover:bg-white/[0.005]"
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center text-xs font-bold shrink-0">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-foreground truncate max-w-[160px]">
                                  {res.userName || "Anonymous Voter"}
                                </div>
                                <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                                  {res.userEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                          {analytics.questions.map((q) => {
                            const ans = res.answers.find(
                              (a) => a.questionId === q.questionId
                            );
                            const optText = ans
                              ? questionOptionMap.get(q.questionId)?.get(ans.optionId)
                              : null;

                            return (
                              <td key={q.questionId} className="p-3">
                                {optText ? (
                                  <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-500 border border-orange-500/20 max-w-[200px] truncate">
                                    {optText}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground/50">
                                    Skipped
                                  </span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(res.submittedAt).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
