import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge, MandatoryBadge } from "@/components/ui/badge";
import { useApi, ApiError } from "@/lib/api";
import type { Poll } from "@/types";
import {
  Copy,
  ExternalLink,
  Pencil,
  Rocket,
  Send,
  BarChart3,
  Check,
  AlertCircle,
  EyeOff,
  ShieldCheck,
  Clock,
} from "lucide-react";

export function PollManage() {
  const { id } = useParams();
  const api = useApi();
  const navigate = useNavigate();

  const [poll, setPoll] = useState<Poll | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function load() {
    if (!id) return;
    try {
      const { poll } = await api.getPoll(id);
      setPoll(poll);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load poll");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error)
    return (
      <Card className="border-destructive/30">
        <CardContent className="pt-6 text-destructive text-sm">
          {error}
        </CardContent>
      </Card>
    );
  if (!poll) return <div className="text-muted-foreground">Loading…</div>;

  const shareUrl = `${window.location.origin}/p/${poll.id}`;

  async function action(label: string, fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : `Failed to ${label}`);
    } finally {
      setBusy(false);
    }
  }

  const statusHint = {
    draft:
      "This poll is a draft. Activate it to start collecting responses.",
    active: "Anyone with this link can respond right now.",
    expired: "Poll has expired — no new responses accepted.",
    published:
      "Results are published. Anyone with the link sees the read-only tally.",
  }[poll.status];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {poll.title}
            </h1>
            <StatusBadge status={poll.status} withDot />
          </div>
          {poll.description && (
            <p className="text-muted-foreground text-sm max-w-prose">
              {poll.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              {poll.isAnonymous ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Anonymous
                </>
              ) : (
                <>
                  <ShieldCheck className="h-3.5 w-3.5" /> Signed-in only
                </>
              )}
            </span>
            {poll.expiresAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Expires {new Date(poll.expiresAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        {poll.status === "draft" && (
          <Button
            variant="outline"
            onClick={() => navigate(`/polls/${poll.id}/edit`)}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Share link</CardTitle>
          <CardDescription>{statusHint}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-elevated px-3 py-2 text-sm font-mono text-foreground/90">
              {shareUrl}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              title="Copy"
            >
              {copied ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Link to={`/p/${poll.id}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="icon" title="Open in new tab">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {copied && (
            <div className="text-xs text-success inline-flex items-center gap-1">
              <Check className="h-3 w-3" /> Copied to clipboard
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            What you can do next depends on the poll's status.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {poll.status === "draft" && (
            <Button
              disabled={busy}
              onClick={() =>
                action("activate", () => api.activatePoll(poll.id))
              }
            >
              <Rocket className="h-4 w-4" /> Activate poll
            </Button>
          )}
          {(poll.status === "active" || poll.status === "expired") && (
            <Button
              variant="accent"
              disabled={busy}
              onClick={() => action("publish", () => api.publishPoll(poll.id))}
            >
              <Send className="h-4 w-4" /> Publish results
            </Button>
          )}
          <Link to={`/polls/${poll.id}/analytics`}>
            <Button variant="outline">
              <BarChart3 className="h-4 w-4" /> View analytics
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            {poll.questions.length} question
            {poll.questions.length === 1 ? "" : "s"} · Single choice each
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {poll.questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-lg border border-border bg-elevated/40 p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-foreground leading-snug">
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    Q{idx + 1}
                  </span>
                  {q.text}
                </div>
                {q.isMandatory ? (
                  <MandatoryBadge />
                ) : (
                  <span className="text-[10px] uppercase tracking-wide font-mono text-muted-foreground">
                    Optional
                  </span>
                )}
              </div>
              <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                {q.options.map((o, oIdx) => (
                  <li
                    key={o.id}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-surface border border-border font-mono text-[10px]">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="text-foreground/90">{o.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/8 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
