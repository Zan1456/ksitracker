import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "box-border w-full rounded-full border border-white/20 bg-white/[0.12] px-5 py-4 text-[14.5px] font-semibold text-text placeholder:text-white/40 outline-none transition-colors focus:border-accent",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono text-[10.5px] font-semibold tracking-[0.14em] text-text-faint">{children}</span>
  );
}
