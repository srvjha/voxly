import { useEffect, useState } from "react";
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

function ResultBars({ questions }: { questions: PollTallyQuestion[] }) {
  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <div key={q.questionId} className="space-y-2">
          <div className="font-medium">
            {q.text}
            <span className="ml-2 text-xs text-muted-foreground">
              {q.totalAnswers} response
              {q.totalAnswers === 1 ? "" : "s"}
            </span>
          </div>
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
        </div>
      ))}
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

  if (error && !poll) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>
            {errorStatus === 404
              ? "Poll not found"
              : errorStatus === 410
                ? "Poll closed"
                : "Couldn't load poll"}
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  if (!poll) return <div className="text-muted-foreground">Loading…</div>;

  if (poll.status === "published" && poll.tallies) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{poll.title}</h1>
          {poll.description && (
            <p className="text-muted-foreground text-sm mt-1">
              {poll.description}
            </p>
          )}
          <div className="text-sm text-muted-foreground mt-2">
            {poll.tallies.totalResponses} total response
            {poll.tallies.totalResponses === 1 ? "" : "s"} • Published
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

  if (submitted) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Thanks for responding!</CardTitle>
          <CardDescription>
            Your response was recorded. The creator will publish the results
            when the poll closes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (poll.status !== "active") {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Poll not accepting responses</CardTitle>
          <CardDescription>Current status: {poll.status}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!poll.isAnonymous && !isSignedIn) {
    return (
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{poll.title}</CardTitle>
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
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{poll.title}</h1>
        {poll.description && (
          <p className="text-muted-foreground text-sm mt-1">
            {poll.description}
          </p>
        )}
        {poll.isAnonymous && (
          <p className="text-xs text-muted-foreground mt-2">
            Anonymous poll — your identity is not recorded.
          </p>
        )}
      </div>

      {poll.questions.map((q, idx) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {idx + 1}. {q.text}
              {!q.isMandatory && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {q.options.map((o) => {
              const selected = answers[q.id] === o.id;
              return (
                <label
                  key={o.id}
                  className={`flex items-center gap-3 rounded-md border border-border px-3 py-2 cursor-pointer transition-colors ${
                    selected
                      ? "border-primary bg-primary/10"
                      : "hover:bg-accent"
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={selected}
                    onChange={() =>
                      setAnswers((a) => ({ ...a, [q.id]: o.id }))
                    }
                    className="accent-primary"
                  />
                  <span className="text-sm">{o.text}</span>
                </label>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onSubmit} disabled={submitting} size="lg">
          {submitting ? "Submitting…" : "Submit response"}
        </Button>
      </div>
    </div>
  );
}
