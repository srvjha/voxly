import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useApi, ApiError } from "@/lib/api";
import type { CreatePollPayload, QuestionDraft } from "@/types";

function newOption() {
  return { text: "" };
}
function newQuestion(): QuestionDraft {
  return { text: "", isMandatory: true, options: [newOption(), newOption()] };
}

function toLocalDatetimeInputValue(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PollBuilder() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const api = useApi();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [expiresAt, setExpiresAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toLocalDatetimeInputValue(d);
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const { poll } = await api.getPoll(id);
        setTitle(poll.title);
        setDescription(poll.description ?? "");
        setIsAnonymous(poll.isAnonymous);
        if (poll.expiresAt) {
          setExpiresAt(toLocalDatetimeInputValue(new Date(poll.expiresAt)));
        }
        setQuestions(
          poll.questions.map((q) => ({
            text: q.text,
            isMandatory: q.isMandatory,
            options: q.options.map((o) => ({ text: o.text })),
          })),
        );
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Failed to load poll");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions((qs) =>
      qs.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  }

  function updateOption(qIdx: number, oIdx: number, text: string) {
    setQuestions((qs) =>
      qs.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((o, j) => (j === oIdx ? { text } : o)),
            }
          : q,
      ),
    );
  }

  async function onSave() {
    setError(null);
    if (!title.trim()) return setError("Title is required");
    if (!expiresAt) return setError("Expiry is required");
    if (new Date(expiresAt) <= new Date())
      return setError("Expiry must be in the future");
    for (const q of questions) {
      if (!q.text.trim()) return setError("Every question needs text");
      if (q.options.length < 2)
        return setError("Every question needs at least 2 options");
      for (const o of q.options) {
        if (!o.text.trim()) return setError("Every option needs text");
      }
    }

    const payload: CreatePollPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      isAnonymous,
      expiresAt: new Date(expiresAt).toISOString(),
      questions: questions.map((q) => ({
        text: q.text.trim(),
        isMandatory: q.isMandatory,
        options: q.options.map((o) => ({ text: o.text.trim() })),
      })),
    };

    setSubmitting(true);
    try {
      const result = isEdit && id
        ? await api.updatePoll(id, payload)
        : await api.createPoll(payload);
      navigate(`/polls/${result.poll.id}/manage`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to save poll");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEdit ? "Edit poll" : "Create a new poll"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Build all your questions before activating. Once responses come in,
          the structure is locked.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Poll details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should we ask?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short context for respondents…"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expires">Expires at</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Response mode</Label>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="anon"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                />
                <Label htmlFor="anon" className="cursor-pointer">
                  Allow anonymous responses
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <Card key={qIdx}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Question {qIdx + 1}</CardTitle>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setQuestions((qs) => qs.filter((_, i) => i !== qIdx))
                    }
                    title="Remove question"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Question text"
                value={q.text}
                onChange={(e) => updateQuestion(qIdx, { text: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`mandatory-${qIdx}`}
                  checked={q.isMandatory}
                  onChange={(e) =>
                    updateQuestion(qIdx, { isMandatory: e.target.checked })
                  }
                />
                <Label
                  htmlFor={`mandatory-${qIdx}`}
                  className="cursor-pointer text-muted-foreground"
                >
                  Mandatory
                </Label>
              </div>

              <div className="space-y-2 pt-1">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Options
                </Label>
                {q.options.map((o, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${oIdx + 1}`}
                      value={o.text}
                      onChange={(e) =>
                        updateOption(qIdx, oIdx, e.target.value)
                      }
                    />
                    {q.options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateQuestion(qIdx, {
                            options: q.options.filter((_, j) => j !== oIdx),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateQuestion(qIdx, {
                      options: [...q.options, newOption()],
                    })
                  }
                >
                  <Plus className="h-4 w-4" /> Add option
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button
          variant="outline"
          onClick={() => setQuestions((qs) => [...qs, newQuestion()])}
        >
          <Plus className="h-4 w-4" /> Add question
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Create poll"}
        </Button>
      </div>
    </div>
  );
}
