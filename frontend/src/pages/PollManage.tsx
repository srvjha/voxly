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
import { useApi, ApiError } from "@/lib/api";
import type { Poll } from "@/types";
import { Copy, ExternalLink, Pencil, Rocket, Send } from "lucide-react";

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
      <Card>
        <CardContent className="pt-6 text-destructive">{error}</CardContent>
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

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{poll.title}</h1>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md capitalize bg-primary/15 text-primary">
              {poll.status}
            </span>
          </div>
          {poll.description && (
            <p className="text-muted-foreground text-sm mt-1">
              {poll.description}
            </p>
          )}
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
          <CardDescription>
            {poll.status === "draft"
              ? "Activate the poll first to start collecting responses."
              : poll.status === "active"
                ? "Anyone with this link can answer."
                : poll.status === "published"
                  ? "Anyone with this link will see the published results."
                  : "Poll has expired — no new responses accepted."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md border border-border bg-input px-3 py-2 text-sm">
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
              <Copy className="h-4 w-4" />
            </Button>
            <Link to={`/p/${poll.id}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="icon" title="Open">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          {copied && (
            <div className="text-xs text-emerald-400">Copied!</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {poll.status === "draft" && (
            <Button
              disabled={busy}
              onClick={() => action("activate", () => api.activatePoll(poll.id))}
            >
              <Rocket className="h-4 w-4" /> Activate
            </Button>
          )}
          {(poll.status === "active" || poll.status === "expired") && (
            <Button
              disabled={busy}
              onClick={() => action("publish", () => api.publishPoll(poll.id))}
            >
              <Send className="h-4 w-4" /> Publish results
            </Button>
          )}
          <Link to={`/polls/${poll.id}/analytics`}>
            <Button variant="outline">View analytics</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Questions</CardTitle>
          <CardDescription>
            {poll.questions.length} question
            {poll.questions.length === 1 ? "" : "s"} • Single choice each
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {poll.questions.map((q, idx) => (
            <div key={q.id} className="border border-border rounded-lg p-4">
              <div className="font-medium">
                {idx + 1}. {q.text}
                {!q.isMandatory && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (optional)
                  </span>
                )}
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {q.options.map((o) => (
                  <li key={o.id}>• {o.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}
    </div>
  );
}
