import { STATUS_LABELS, type SubmissionStatus } from "@/lib/constants";

const statusClassNames: Record<SubmissionStatus, string> = {
  new: "bg-amber-100 text-amber-800 ring-amber-200",
  in_review: "bg-sky-100 text-sky-800 ring-sky-200",
  resolved: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

type StatusBadgeProps = {
  status: SubmissionStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClassNames[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
