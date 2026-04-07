type QuantityStepperProps = {
  value: number;
  onChange: (next: number) => void;
};

export function QuantityStepper({ value, onChange }: QuantityStepperProps) {
  const decrease = () => onChange(Math.max(0, value - 1));
  const increase = () => onChange(value + 1);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={decrease}
        className="h-11 w-11 rounded-2xl border border-white/10 bg-white/5 text-lg text-[#f4efe8] transition hover:border-white/20 hover:bg-white/10"
      >
        -
      </button>
      <div className="min-w-14 rounded-2xl border border-[#43f0c1]/25 bg-black/45 px-4 py-2.5 text-center text-sm font-bold text-[#f4efe8] shadow-[inset_0_0_0_1px_rgba(67,240,193,0.08)]">
        {value}
      </div>
      <button
        type="button"
        onClick={increase}
        className="h-11 w-11 rounded-2xl border border-[#43f0c1]/30 bg-[#43f0c1]/12 text-lg text-[#baffef] transition hover:border-[#43f0c1]/50 hover:bg-[#43f0c1]/18"
      >
        +
      </button>
    </div>
  );
}
