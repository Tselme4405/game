type EmptyStateProps = {
  title?: string;
  subtitle?: string;
};

export function EmptyState({
  title = "Хоосон байна",
  subtitle = "Одоогоор харагдах мэдээлэл алга.",
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/40 px-6 py-10 text-center">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
    </div>
  );
}
