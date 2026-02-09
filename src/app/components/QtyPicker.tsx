"use client";

export default function QtyPicker({
  qty,
  onChange,
}: {
  qty: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className="h-10 w-10 rounded-xl border border-gray-300 text-xl"
        onClick={() => onChange(qty - 1)}
      >
        −
      </button>
      <div className="min-w-12 text-center text-xl font-semibold">{qty}</div>
      <button
        type="button"
        className="h-10 w-10 rounded-xl border border-gray-300 text-xl"
        onClick={() => onChange(qty + 1)}
      >
        +
      </button>
    </div>
  );
}
