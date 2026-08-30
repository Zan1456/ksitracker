"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg" | "sm";

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-strong border border-transparent",
  secondary: "bg-transparent text-text border border-border-strong hover:border-text-faint",
  ghost: "bg-bg-inset text-text-muted border border-border hover:text-text",
  danger:
    "bg-danger-bg text-danger border border-danger-border hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-4 text-[15px]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...(props as HTMLMotionProps<"button">)}
      />
    );
  }
);
Button.displayName = "Button";
