import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApi, ApiError } from "@/lib/api";
import type { PollListItem } from "@/types";
import { Plus, Trash2 } from "lucide-react";

function StatusBadge({ status }: { status: PollListItem["status"] }) {
  const colors: Record<PollListItem["status"], string> = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-primary/15 text-primary",
    expired: "bg-destructive/15 text-destructive",
    published: "bg-emerald-500/15 text-emerald-400",
  };
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-md capitalize ${colors[status]}`}
    >
      {status}
    </span>
  );
}

export function Dashboard() {
  const api = useApi();
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PollListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const res = await api.listMyPolls();
      setPolls(res.polls);
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
      setPolls((p) => p?.filter((x) => x.id !== id) ?? null);
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My polls</h1>
          <p className="text-muted-foreground text-sm">
            Drafts, active polls, expired and published results.
          </p>
        </div>
        <Button onClick={() => navigate("/polls/new")}>
          <Plus className="h-4 w-4" /> New poll
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {polls === null && !error ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : polls && polls.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No polls yet. Create your first one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {polls?.map((p) => (
            <Card key={p.id} className="flex flex-col">
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="leading-tight">{p.title}</CardTitle>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && (
                  <CardDescription>{p.description}</CardDescription>
                )}
                <div className="text-xs text-muted-foreground pt-2 space-y-0.5">
                  <div>{p.responseCount} responses</div>
                  {p.expiresAt && (
                    <div>
                      Expires {new Date(p.expiresAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Link to={`/polls/${p.id}/manage`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Manage
                  </Button>
                </Link>
                <Link to={`/polls/${p.id}/analytics`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Analytics
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(p.id)}
                  title="Delete poll"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
