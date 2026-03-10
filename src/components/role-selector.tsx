import { cn } from "@/lib/utils";
import type { EntryRole } from "@/lib/types";

type RoleSelectorProps = {
  selectedRole: EntryRole | null;
  onSelect: (role: EntryRole) => void;
};

const options: Array<{ role: EntryRole; label: string; desc: string }> = [
  { role: "student", label: "Сурагч", desc: "Захиалга хийх" },
  { role: "teacher", label: "Багш", desc: "Хүргэлт шалгах" },
];

export function RoleSelector({ selectedRole, onSelect }: RoleSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.role}
          type="button"
          onClick={() => onSelect(option.role)}
          className={cn(
            "rounded-2xl border p-4 text-left transition",
            "hover:border-neutral-500 hover:bg-neutral-800/80",
            selectedRole === option.role
              ? "border-neutral-400 bg-neutral-800"
              : "border-neutral-800 bg-neutral-900/70",
          )}
        >
          <p className="text-base font-semibold">{option.label}</p>
          <p className="mt-1 text-sm text-neutral-400">{option.desc}</p>
        </button>
      ))}
    </div>
  );
}
