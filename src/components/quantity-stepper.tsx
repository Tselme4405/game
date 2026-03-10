type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
};

export function QuantityStepper({ value, onChange }: QuantityStepperProps) {
  const decrease = () => onChange(Math.max(0, value - 1));
  const increase = () => onChange(value + 1);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrease}
        className="h-10 w-10 rounded-xl border border-neutral-700 bg-neutral-900 text-lg text-neutral-200 transition hover:border-neutral-500"
      >
        -
      </button>
      <div className="min-w-12 rounded-xl border border-neutral-700 bg-neutral-950 px-3 py-2 text-center text-sm font-semibold">
        {value}
      </div>
      <button
        type="button"
        onClick={increase}
        className="h-10 w-10 rounded-xl border border-neutral-700 bg-neutral-900 text-lg text-neutral-200 transition hover:border-neutral-500"
      >
        +
      </button>
    </div>
  );
}
