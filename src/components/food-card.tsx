import { cn } from "@/lib/utils";
import { QuantityStepper } from "@/components/quantity-stepper";

type FoodCardProps = {
  title: string;
  subtitle: string;
  qty: number;
  onQtyChange: (qty: number) => void;
};

export function FoodCard({ title, subtitle, qty, onQtyChange }: FoodCardProps) {
  return (
    <article
      className={cn(
        "rounded-[1.75rem] border p-5 shadow-[0_22px_60px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition duration-200",
        qty > 0
          ? "border-[#43f0c1]/40 bg-black/45"
          : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/38",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#f4efe8]">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#f4efe8]/68">{subtitle}</p>
        </div>

        <div
          className={cn(
            "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em]",
            qty > 0
              ? "border-[#43f0c1]/35 bg-[#43f0c1]/12 text-[#baffef]"
              : "border-white/10 bg-white/5 text-[#f4efe8]/60",
          )}
        >
          {qty > 0 ? `${qty} сонгосон` : "Ready"}
        </div>
      </div>

      <div className="mt-5">
        <QuantityStepper value={qty} onChange={onQtyChange} />
      </div>
    </article>
  );
}
