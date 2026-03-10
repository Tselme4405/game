type SummaryRowProps = {
  label: string;
  value: string;
};

export function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-3">
      <span className="text-sm text-neutral-300">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
