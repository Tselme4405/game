import { QuantityStepper } from "@/components/quantity-stepper";

type FoodCardProps = {
  title: string;
  subtitle: string;
  qty: number;
  onQtyChange: (qty: number) => void;
};

export function FoodCard({ title, subtitle, qty, onQtyChange }: FoodCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-neutral-400">{subtitle}</p>
      <div className="mt-5">
        <QuantityStepper value={qty} onChange={onQtyChange} />
      </div>
    </article>
  );
}
