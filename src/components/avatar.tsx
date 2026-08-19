import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

export function Avatar({
  name,
  size = 32,
  highlight = false,
  className,
}: {
  name: string;
  size?: number;
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-medium",
        highlight ? "border-warning-border bg-warning-bg text-warning" : "border-border-strong bg-bg-inset text-text-secondary",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {initials(name)}
    </div>
  );
}
