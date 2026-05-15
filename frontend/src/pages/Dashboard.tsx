import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { useApi, ApiError } from "@/lib/api";
import type { PollListItem, PollParticipationItem } from "@/types";
import {
  PlusCircle,
  Trash2,
  BarChart3,
  Settings2,
  Clock,
  Users,
  Inbox,
  ListChecks,
  Vote,
  Eye,
} from "lucide-react";

const cardSurface = [
  "bg-white border-orange-200/60 shadow-[0_4px_14px_-4px_rgba(249,115,22,0.10),0_2px_4px_-2px_rgba(15,14,46,0.06)]",
  "dark:bg-[#080626] dark:border-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
].join(" ");

function formatRelativeExpiry(iso: string | null | undefined) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  const abs = Math.abs(ms);
  const day = 86_400_000;
  const hour = 3_600_000;
  const min = 60_000;
  let value: string;
  if (abs >= day) value = `${Math.round(abs / day)}d`;
  else if (abs >= hour) value = `${Math.round(abs / hour)}h`;
  else value = `${Math.max(1, Math.round(abs / min))}m`;
  return ms >= 0 ? `Expires in ${value}` : `Expired ${value} ago`;
}

function formatSubmittedAt(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return new Date(iso).toLocaleDateString();
  const day = 86_400_000;
  const hour = 3_600_000;
  const min = 60_000;
  if (ms < min) return "just now";
  if (ms < hour) return `${Math.round(ms / min)}m ago`;
  if (ms < day) return `${Math.round(ms / hour)}h ago`;
  if (ms < day * 7) return `${Math.round(ms / day)}d ago`;
  return new Date(iso).toLocaleDateString();
}

type Tab = "created" | "participated";

export function Dashboard() {
  const api = useApi();
  const navigate = useNavigate();
  const [created, setCreated] = useState<PollListItem[] | null>(null);
  const [participated, setParticipated] = useState<
    PollParticipationItem[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("created");

  async function load() {
    try {
      const [mine, joined] = await Promise.all([
        api.listMyPolls(),
        api.listParticipatedPolls(),
      ]);
      setCreated(mine.polls);
      setParticipated(joined.polls);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load polls");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Delete this poll? This is permanent.")) return;
    try {
      await api.deletePoll(id);
      setCreated((p) => p?.filter((x) => x.id !== id) ?? null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  const totalResponses = useMemo(
    () => created?.reduce((sum, p) => sum + (p.responseCount ?? 0), 0) ?? 0,
    [created],
  );
  const activeCount = useMemo(
    () => created?.filter((p) => p.status === "active").length ?? 0,
    [created],
  );

  const isLoading = created === null && participated === null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-accent-600 dark:text-accent-400 mb-1.5">
            Dashboard
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Your activity
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Everything you've created and every poll you've responded to —
            all in one place.
          </p>
        </div>
        <Button onClick={() => navigate("/polls/new")}>
          <PlusCircle className="h-4 w-4" /> New poll
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Polls created"
          value={created?.length ?? 0}
          icon={BarChart3}
        />
        <StatCard
          label="Live now"
          value={activeCount}
          icon={Clock}
          accent="orange"
        />
        <StatCard
          label="Total responses"
          value={totalResponses}
          icon={Users}
        />
        <StatCard
          label="Participated in"
          value={participated?.length ?? 0}
          icon={Vote}
          accent="blue"
        />
      </div>

      <div className="border-b border-border flex gap-1">
        <TabButton
          active={tab === "created"}
          onClick={() => setTab("created")}
          icon={ListChecks}
          label="Created by me"
          count={created?.length}
        />
        <TabButton
          active={tab === "participated"}
          onClick={() => setTab("participated")}
          icon={Vote}
          label="I responded to"
          count={participated?.length}
        />
      </div>

      {error && (
        <Card className={`border-destructive/30 ${cardSurface}`}>
          <CardContent className="pt-6 text-destructive text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {isLoading && !error ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-44 rounded-lg border border-border bg-card animate-pulse ${cardSurface}`}
            />
          ))}
        </div>
      ) : tab === "created" ? (
        <CreatedSection polls={created ?? []} onDelete={onDelete} />
      ) : (
        <ParticipatedSection polls={participated ?? []} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      ].join(" ")}
    >
      <Icon className="h-4 w-4" />
      {label}
      {typeof count === "number" && (
        <span
          className={[
            "inline-flex items-center justify-center rounded-full min-w-[20px] h-5 px-1.5 text-[10px] font-mono tabular-nums",
            active
              ? "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function CreatedSection({
  polls,
  onDelete,
}: {
  polls: PollListItem[];
  onDelete: (id: string) => void;
}) {
  const navigate = useNavigate();
  if (polls.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No polls yet"
        body="Create your first poll to start collecting responses."
        cta={
          <Button onClick={() => navigate("/polls/new")}>
            <PlusCircle className="h-4 w-4" /> Create a poll
          </Button>
        }
      />
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
      {polls.map((p) => (
        <article
          key={p.id}
          className={`group relative flex flex-col rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-border-strong ${cardSurface}`}
        >
          <div className="p-5 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
                {p.title}
              </h3>
              <StatusBadge status={p.status} withDot />
            </div>
            {p.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-normal">
                {p.description}
              </p>
            )}
            <div className="flex items-center gap-4 pt-1 text-xs">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums text-foreground">
                  {p.responseCount}
                </span>{" "}
                response{p.responseCount === 1 ? "" : "s"}
              </span>
              {p.expiresAt && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {formatRelativeExpiry(p.expiresAt)}
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-border p-3 flex items-center gap-2">
            <Link to={`/polls/${p.id}/manage`} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">
                <Settings2 className="h-4 w-4" /> Manage
              </Button>
            </Link>
            <Link to={`/polls/${p.id}/analytics`} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">
                <BarChart3 className="h-4 w-4" /> Analytics
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(p.id)}
              title="Delete poll"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ParticipatedSection({ polls }: { polls: PollParticipationItem[] }) {
  if (polls.length === 0) {
    return (
      <EmptyState
        icon={Vote}
        title="You haven't responded to any polls yet"
        body="Polls you respond to with a signed-in account will appear here. Anonymous responses can't be linked back to you."
      />
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
      {polls.map((p) => (
        <article
          key={p.id}
          className={`group relative flex flex-col rounded-lg border border-border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-border-strong ${cardSurface}`}
        >
          <div className="p-5 flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
                {p.title}
              </h3>
              <StatusBadge status={p.status} withDot />
            </div>
            {p.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-normal">
                {p.description}
              </p>
            )}
            <div className="flex items-center gap-4 pt-1 text-xs flex-wrap">
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Vote className="h-3.5 w-3.5 text-blue-500" />
                You voted {formatSubmittedAt(p.submittedAt)}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums text-foreground">
                  {p.responseCount}
                </span>{" "}
                total
              </span>
            </div>
          </div>
          <div className="border-t border-border p-3 flex items-center gap-2">
            <Link to={`/p/${p.id}`} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">
                <Eye className="h-4 w-4" />
                {p.status === "published" ? "View results" : "View poll"}
              </Button>
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta?: React.ReactNode;
}) {
  return (
    <Card className={`border-dashed ${cardSurface}`}>
      <CardContent className="pt-10 pb-10 text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-elevated text-muted-foreground mx-auto">
          <Icon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <div className="font-display font-semibold text-foreground">
            {title}
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {body}
          </p>
        </div>
        {cta}
      </CardContent>
    </Card>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  accent?: "orange" | "blue";
}) {
  const tone =
    accent === "orange"
      ? "bg-orange-500/15 text-orange-500"
      : accent === "blue"
        ? "bg-blue-500/15 text-blue-500"
        : "bg-primary/10 text-primary";
  return (
    <div
      className={`rounded-lg border border-border bg-card p-4 flex items-center gap-3 ${cardSurface}`}
    >
      <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-md ${tone}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-mono">
          {label}
        </div>
        <div className="font-display text-2xl font-bold tabular-nums leading-none mt-1">
          {value}
        </div>
      </div>
    </div>
  );
}
