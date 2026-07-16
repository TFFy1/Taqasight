import { CheckCircle2, Loader2, Play } from "lucide-react";
import { usePipelineStages, useRunAnalysis } from "@/lib/queries";
import { cx } from "@/components/ui";

const STAGE_LABEL: Record<string, string> = {
  queued: "Queued…",
  computing: "Computing metrics…",
  interpreting: "AI interpreting…",
  done: "Analysis complete",
};

/** "Run analysis" — POSTs /analyze and shows pipeline progress states. */
export function RunAnalysis() {
  const run = useRunAnalysis();
  const stage = usePipelineStages(run.isPending, run.isSuccess);

  return (
    <div className="flex items-center gap-3">
      {stage ? (
        <span
          className={cx(
            "hidden items-center gap-1.5 text-xs sm:inline-flex",
            stage === "done" ? "text-ok" : "text-text-mid",
          )}
          aria-live="polite"
        >
          {stage === "done" ? (
            <CheckCircle2 className="size-3.5" aria-hidden />
          ) : (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          )}
          {STAGE_LABEL[stage]}
        </span>
      ) : run.isError ? (
        <span className="hidden text-xs text-crit sm:inline" role="alert">
          Run failed — {run.error.message}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => run.mutate()}
        disabled={run.isPending}
        className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-white shadow-card transition-all hover:bg-accent-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {run.isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Play className="size-4" aria-hidden />
        )}
        Run analysis
      </button>
    </div>
  );
}
