import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import {
  Plus,
  Trash2,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  ListChecks,
  Eye,
} from "lucide-react";
import { useApi, ApiError } from "@/lib/api";
import type { CreatePollPayload } from "@/types";



const optionSchema = z.object({
  text: z.string().trim().min(1, "Option text is required"),
});

const questionSchema = z.object({
  text: z.string().trim().min(1, "Question text is required"),
  isMandatory: z.boolean(),
  options: z
    .array(optionSchema)
    .min(2, "Each question needs at least 2 options"),
});

const detailsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  isAnonymous: z.boolean(),
  expiresAt: z
    .string()
    .min(1, "Expiry is required")
    .refine(
      (v) => new Date(v) > new Date(),
      "Expiry must be in the future",
    ),
});

const fullSchema = detailsSchema.extend({
  questions: z.array(questionSchema).min(1, "At least one question required"),
});

type FormValues = z.infer<typeof fullSchema>;

const DETAILS_FIELDS = ["title", "description", "isAnonymous", "expiresAt"] as const;


function toLocalDatetimeInputValue(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return toLocalDatetimeInputValue(d);
}

const cardSurface = [
  "bg-white border-orange-200/60 shadow-[0_4px_14px_-4px_rgba(249,115,22,0.10),0_2px_4px_-2px_rgba(15,14,46,0.06)]",
  "dark:bg-[#080626] dark:border-white/10 dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]",
].join(" ");

type Step = 1 | 2 | 3;


export function PollBuilder() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const api = useApi();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(1);
  const [furthestStep, setFurthestStep] = useState<Step>(1);
  const [loading, setLoading] = useState(isEdit);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(fullSchema) as Resolver<FormValues>,
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      isAnonymous: false,
      expiresAt: defaultExpiry(),
      questions: [
        { text: "", isMandatory: true, options: [{ text: "" }, { text: "" }] },
      ],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  const questionFields = useFieldArray({ control, name: "questions" });

  const values = watch();

  useEffect(() => {
    if (!isEdit || !id) return;
    (async () => {
      try {
        const { poll } = await api.getPoll(id);
        form.reset({
          title: poll.title,
          description: poll.description ?? "",
          isAnonymous: poll.isAnonymous,
          expiresAt: poll.expiresAt
            ? toLocalDatetimeInputValue(new Date(poll.expiresAt))
            : defaultExpiry(),
          questions: poll.questions.map((q) => ({
            text: q.text,
            isMandatory: q.isMandatory,
            options: q.options.map((o) => ({ text: o.text })),
          })),
        });
        setFurthestStep(3);
      } catch (e) {
        setSubmitError(e instanceof ApiError ? e.message : "Failed to load poll");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEdit]);

  async function goNext() {
    setSubmitError(null);
    if (step === 1) {
      const ok = await trigger([...DETAILS_FIELDS]);
      if (!ok) return;
      setStep(2);
      setFurthestStep((f) => (f < 2 ? 2 : f));
      return;
    }
    if (step === 2) {
      const ok = await trigger("questions");
      if (!ok) return;
      setStep(3);
      setFurthestStep((f) => (f < 3 ? 3 : f));
      return;
    }
  }

  function goBack() {
    setSubmitError(null);
    setStep((s) => (s > 1 ? ((s - 1) as Step) : s));
  }

  function tryJumpTo(target: Step) {
    setSubmitError(null);
    if (target <= furthestStep) setStep(target);
  }

  const onSubmit = handleSubmit(async (data) => {
    setSubmitError(null);
    const payload: CreatePollPayload = {
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      isAnonymous: data.isAnonymous,
      expiresAt: new Date(data.expiresAt).toISOString(),
      questions: data.questions.map((q) => ({
        text: q.text.trim(),
        isMandatory: q.isMandatory,
        options: q.options.map((o) => ({ text: o.text.trim() })),
      })),
    };

    try {
      const result =
        isEdit && id
          ? await api.updatePoll(id, payload)
          : await api.createPoll(payload);
      navigate(`/polls/${result.poll.id}/manage`);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Failed to save poll");
    }
  });

  if (loading) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8"
    >
      <div className="space-y-8 min-w-0">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-accent-600 dark:text-accent-400 mb-1.5">
            {isEdit ? "Edit poll" : "New poll"}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            {isEdit ? "Edit your poll" : "Create a new poll"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build all your questions before activating. Once responses come in,
            the structure is locked.
          </p>
        </div>

        <StepIndicator
          step={step}
          furthest={furthestStep}
          onJump={tryJumpTo}
        />

        {step === 1 && (
          <DetailsStep
            register={register}
            errors={errors}
            isAnonymous={values.isAnonymous}
            setAnon={(v) =>
              setValue("isAnonymous", v, { shouldValidate: true })
            }
          />
        )}

        {step === 2 && (
          <QuestionsStep
            control={control}
            register={register}
            errors={errors}
            fields={questionFields.fields}
            appendQuestion={() =>
              questionFields.append({
                text: "",
                isMandatory: true,
                options: [{ text: "" }, { text: "" }],
              })
            }
            removeQuestion={(i) => questionFields.remove(i)}
            getOptions={(qIdx) => values.questions?.[qIdx]?.options ?? []}
            setQuestionOptions={(qIdx, options) =>
              setValue(`questions.${qIdx}.options`, options, {
                shouldValidate: true,
              })
            }
          />
        )}

        {step === 3 && <ReviewStep values={values} />}

        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-32 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            Live respondent preview
          </div>
          <PollPreview
            title={values.title}
            description={values.description ?? ""}
            questions={values.questions ?? []}
            isAnonymous={values.isAnonymous}
          />
          <p className="text-[11px] text-muted-foreground text-center pt-1">
            Updates as you type. Respondents see this exact view.
          </p>
        </div>
      </aside>

      <div
        className={`sticky bottom-4 lg:col-span-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-xl border border-border backdrop-blur p-3 shadow-lg bg-surface/95 ${cardSurface}`}
      >
        <div className="flex justify-start">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground text-center">
          {step === 3 ? (
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle2 className="h-4 w-4" /> Ready to save
            </span>
          ) : (
            <>Step {step} of 3</>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          {step < 3 ? (
            <Button type="button" onClick={goNext} disabled={isSubmitting}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create poll"}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}


function DetailsStep({
  register,
  errors,
  isAnonymous,
  setAnon,
}: {
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  isAnonymous: boolean;
  setAnon: (v: boolean) => void;
}) {
  return (
    <Card className={cardSurface}>
      <CardHeader>
        <CardTitle>Step 1 · Poll details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field label="Title" error={errors.title?.message} htmlFor="title">
          <Input
            id="title"
            placeholder="What should we ask?"
            {...register("title")}
          />
        </Field>

        <Field
          label="Description (optional)"
          htmlFor="description"
          error={errors.description?.message}
        >
          <Textarea
            id="description"
            placeholder="Short context for respondents…"
            {...register("description")}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Expires at"
            htmlFor="expiresAt"
            error={errors.expiresAt?.message}
          >
            <Input
              id="expiresAt"
              type="datetime-local"
              {...register("expiresAt")}
            />
          </Field>

          <div className="space-y-2">
            <Label>Response mode</Label>
            <div className="flex items-stretch gap-2">
              <ModeToggle
                active={isAnonymous}
                onClick={() => setAnon(true)}
                icon={EyeOff}
                label="Anonymous"
                hint="No identity"
              />
              <ModeToggle
                active={!isAnonymous}
                onClick={() => setAnon(false)}
                icon={ShieldCheck}
                label="Signed in"
                hint="Require auth"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


function QuestionsStep({
  control,
  register,
  errors,
  fields,
  appendQuestion,
  removeQuestion,
  getOptions,
  setQuestionOptions,
}: {
  control: ReturnType<typeof useForm<FormValues>>["control"];
  register: ReturnType<typeof useForm<FormValues>>["register"];
  errors: ReturnType<typeof useForm<FormValues>>["formState"]["errors"];
  fields: ReturnType<typeof useFieldArray<FormValues, "questions">>["fields"];
  appendQuestion: () => void;
  removeQuestion: (i: number) => void;
  getOptions: (qIdx: number) => { text: string }[];
  setQuestionOptions: (qIdx: number, options: { text: string }[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-lg font-semibold tracking-tight">
            Step 2 · Questions
          </div>
          <div className="text-sm text-muted-foreground">
            {fields.length} question{fields.length === 1 ? "" : "s"} ·
            Single-choice only
          </div>
        </div>
      </div>

      {fields.map((qField, qIdx) => (
        <Card key={qField.id} className={cardSurface}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary font-mono text-xs font-semibold">
                  {qIdx + 1}
                </span>
                <CardTitle className="text-base">Question {qIdx + 1}</CardTitle>
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(qIdx)}
                  title="Remove question"
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              error={errors.questions?.[qIdx]?.text?.message}
              htmlFor={`q-${qIdx}-text`}
            >
              <Input
                id={`q-${qIdx}-text`}
                placeholder="Question text"
                {...register(`questions.${qIdx}.text`)}
              />
            </Field>

            <OptionsField
              qIdx={qIdx}
              control={control}
              register={register}
              optionsError={
                errors.questions?.[qIdx]?.options?.message ??
                errors.questions?.[qIdx]?.options?.root?.message
              }
              optionErrors={errors.questions?.[qIdx]?.options}
              getOptions={getOptions}
              setOptions={(opts) => setQuestionOptions(qIdx, opts)}
            />

            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Checkbox
                id={`mandatory-${qIdx}`}
                {...register(`questions.${qIdx}.isMandatory`)}
              />
              <Label
                htmlFor={`mandatory-${qIdx}`}
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Mandatory — respondents must answer this
              </Label>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={appendQuestion}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4" /> Add question
      </Button>

      {typeof errors.questions?.message === "string" && (
        <p className="text-xs text-destructive">{errors.questions.message}</p>
      )}
    </div>
  );
}

function OptionsField({
  qIdx,
  register,
  optionsError,
  optionErrors,
  getOptions,
  setOptions,
}: {
  qIdx: number;
  control: ReturnType<typeof useForm<FormValues>>["control"];
  register: ReturnType<typeof useForm<FormValues>>["register"];
  optionsError?: string;
  optionErrors?: { text?: { message?: string } }[] | undefined | unknown;
  getOptions: (qIdx: number) => { text: string }[];
  setOptions: (opts: { text: string }[]) => void;
}) {
  const errArray = Array.isArray(optionErrors)
    ? (optionErrors as { text?: { message?: string } }[])
    : [];
  const options = getOptions(qIdx);

  return (
    <div className="space-y-2 pl-3 border-l-2 border-border">
      <Label className="text-muted-foreground text-[11px] uppercase tracking-wider font-mono">
        Options
      </Label>
      {options.map((_, oIdx) => (
        <div key={oIdx} className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-elevated font-mono text-xs text-muted-foreground">
            {String.fromCharCode(65 + oIdx)}
          </span>
          <Input
            placeholder={`Option ${oIdx + 1}`}
            {...register(`questions.${qIdx}.options.${oIdx}.text`)}
          />
          {options.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setOptions(options.filter((_, j) => j !== oIdx))
              }
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOptions([...options, { text: "" }])}
      >
        <Plus className="h-4 w-4" /> Add option
      </Button>
      {optionsError && (
        <p className="text-xs text-destructive pt-1">{optionsError}</p>
      )}
      {errArray.some((e) => e?.text?.message) && (
        <p className="text-xs text-destructive pt-1">
          Every option needs text.
        </p>
      )}
    </div>
  );
}


function ReviewStep({ values }: { values: FormValues }) {
  return (
    <div className="space-y-4">
      <div>
        <div className="font-display text-lg font-semibold tracking-tight">
          Step 3 · Review &amp; confirm
        </div>
        <div className="text-sm text-muted-foreground">
          Check everything one last time. Hit “Create poll” when you're ready.
        </div>
      </div>

      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" /> Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <ReviewRow label="Title" value={values.title} />
          <ReviewRow
            label="Mode"
            value={values.isAnonymous ? "Anonymous" : "Signed in"}
          />
          <ReviewRow
            label="Expires"
            value={new Date(values.expiresAt).toLocaleString()}
          />
          <ReviewRow
            label="Description"
            value={values.description?.trim() || "—"}
          />
        </CardContent>
      </Card>

      <Card className={cardSurface}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-primary" />
            Questions ({values.questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {values.questions.map((q, qIdx) => (
            <div key={qIdx} className="rounded-md border border-border p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span className="font-mono">Q{qIdx + 1}</span>
                {q.isMandatory && (
                  <span className="inline-flex items-center rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Required
                  </span>
                )}
              </div>
              <div className="font-medium text-foreground mb-2">{q.text}</div>
              <ul className="space-y-1">
                {q.options.map((o, oIdx) => (
                  <li
                    key={oIdx}
                    className="flex items-center gap-2 text-sm text-foreground/80"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border-strong font-mono text-[10px] text-muted-foreground">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    {o.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-mono text-muted-foreground">
        {label}
      </div>
      <div className="text-foreground mt-0.5 break-words">{value}</div>
    </div>
  );
}


function StepIndicator({
  step,
  furthest,
  onJump,
}: {
  step: Step;
  furthest: Step;
  onJump: (target: Step) => void;
}) {
  const steps: { n: Step; label: string }[] = [
    { n: 1, label: "Details" },
    { n: 2, label: "Questions" },
    { n: 3, label: "Review" },
  ];
  return (
    <ol
      className={`flex items-center gap-2 rounded-lg border border-border bg-card p-2 ${cardSurface}`}
    >
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        const reachable = s.n <= furthest;
        return (
          <li key={s.n} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onJump(s.n)}
              className={`group flex w-full items-center gap-2 rounded-md px-3 py-1.5 transition-colors text-left ${
                active
                  ? "bg-primary/10 text-primary"
                  : done
                    ? "text-success hover:bg-success/10"
                    : "text-muted-foreground"
              } ${reachable ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed opacity-60"}`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : done
                      ? "bg-success/15 text-success"
                      : "bg-elevated"
                }`}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.n}
              </span>
              <span className="text-sm font-medium">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="h-px w-4 bg-border" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ModeToggle({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof EyeOff;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center gap-2 rounded-md border px-3 py-2 text-left transition-all ${
        active
          ? "border-primary bg-primary/5 text-foreground shadow-brand"
          : "border-border bg-surface text-muted-foreground hover:bg-elevated"
      }`}
    >
      <Icon
        className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`}
      />
      <div>
        <div className="text-sm font-medium leading-tight text-foreground">
          {label}
        </div>
        <div className="text-[11px] text-muted-foreground leading-tight">
          {hint}
        </div>
      </div>
    </button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PollPreview({
  title,
  description,
  questions,
  isAnonymous,
}: {
  title: string;
  description: string;
  questions: FormValues["questions"];
  isAnonymous: boolean;
}) {
  const hasContent =
    (title?.trim() ?? "") || questions.some((q) => q.text.trim());

  return (
    <Card className={`overflow-hidden ${cardSurface}`}>
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-3 py-2 dark:bg-white/[0.03]">
        <span className="h-2 w-2 rounded-full bg-destructive/70" />
        <span className="h-2 w-2 rounded-full bg-warning/70" />
        <span className="h-2 w-2 rounded-full bg-success/70" />
        <span className="ml-2 font-mono text-[10px] text-muted-foreground truncate">
          voxly.app/p/preview
        </span>
      </div>

      <CardContent className="p-5 space-y-4">
        {!hasContent ? (
          <div className="flex flex-col items-center text-center py-6 text-muted-foreground">
            <ClipboardList className="h-8 w-8 mb-2 opacity-60" />
            <div className="text-sm">Start typing to see your poll here.</div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-primary">
                Live
              </span>
              {isAnonymous && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <EyeOff className="h-3 w-3" />
                  Anonymous
                </span>
              )}
            </div>

            <div>
              <h3 className="font-display text-base font-semibold text-foreground tracking-tight">
                {title?.trim() || "Untitled poll"}
              </h3>
              {description?.trim() && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {description}
                </p>
              )}
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    Q{qIdx + 1}
                  </span>
                  <span className="text-foreground/90 font-medium truncate">
                    {q.text.trim() || (
                      <span className="text-muted-foreground italic">
                        Untitled question
                      </span>
                    )}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {q.options.map((o, oIdx) => (
                    <div
                      key={oIdx}
                      className="flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 dark:bg-white/[0.02]"
                    >
                      <span className="h-3 w-3 rounded-full border-2 border-border-strong" />
                      <span className="text-xs text-foreground/80 truncate">
                        {o.text.trim() || (
                          <span className="text-muted-foreground italic">
                            Option {oIdx + 1}
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Button
              type="button"
              size="sm"
              className="w-full mt-2"
              disabled
            >
              Submit response
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
