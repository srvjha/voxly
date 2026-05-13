import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApi, ApiError } from "@/lib/api";
import type { Analytics as AnalyticsT } from "@/types";
import { RefreshCw } from "lucide-react";

export function Analytics() {
  const { id } = useParams();
  const api = useApi();
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

  if (error)
    return (
      <Card>
        <CardContent className="pt-6 text-destructive">{error}</CardContent>
      </Card>
    );
  if (!data) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Status: <span className="capitalize">{data.status}</span> •{" "}
            {data.totalResponses} response
            {data.totalResponses === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
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
            <Button variant="outline" size="sm">
              Back to poll
            </Button>
          </Link>
        </div>
      </div>

      {data.questions.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-muted-foreground">
            No responses yet.
          </CardContent>
        </Card>
      )}

      {data.questions.map((q) => (
        <Card key={q.questionId}>
          <CardHeader>
            <CardTitle className="text-base">{q.text}</CardTitle>
            <div className="text-xs text-muted-foreground">
              {q.totalAnswers} answer
              {q.totalAnswers === 1 ? "" : "s"}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.options.map((o) => (
              <div key={o.optionId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{o.text}</span>
                  <span className="text-muted-foreground">
                    {o.count} • {o.percentage}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${o.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
