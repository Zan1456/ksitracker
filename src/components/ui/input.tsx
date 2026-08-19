import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "box-border w-full rounded-lg border border-border-strong bg-bg-inset px-3.5 py-3.5 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/20",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export function Label({ children }: { children: React.ReactNode }) {
  return <span className="text-[12.5px] font-medium text-text-secondary">{children}</span>;
}
