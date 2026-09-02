"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "secondary" | "dark" | "danger";
type Size = "md" | "lg" | "sm";

const variantClasses: Record<Variant, string> = {
  // The default CTA everywhere on a blue/dark background: white pill, brand-blue label.
  primary: "bg-white text-brand-blue border border-transparent hover:bg-white/90",
  // Max-emphasis CTA — the design's signature yellow, used sparingly (challenge unlocked, publish).
  accent: "bg-accent text-accent-fg border border-transparent hover:bg-accent-strong",
  // Secondary/cancel actions: translucent outline on top of any background.
  secondary: "bg-white/10 text-text border border-white/25 hover:bg-white/15",
  // For buttons that sit on top of a yellow/light card and need to read as the CTA there.
  dark: "bg-[#0A0A0B] text-white border border-transparent hover:bg-black",
  danger: "bg-danger-bg text-danger border border-danger-border hover:opacity-90",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-3 text-[13px] font-bold",
  md: "px-5 py-4 text-[14px] font-bold",
  lg: "px-5 py-[19px] text-[16px] font-extrabold",
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
          "inline-flex items-center justify-center gap-2 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
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
