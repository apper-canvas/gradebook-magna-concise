import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Badge = forwardRef(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-slate-100 text-slate-800",
    success: "bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300",
    warning: "bg-gradient-to-r from-warning-100 to-warning-200 text-warning-800 border border-warning-300",
    error: "bg-gradient-to-r from-error-100 to-error-200 text-error-800 border border-error-300",
    info: "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300"
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export default Badge;