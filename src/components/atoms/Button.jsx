import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Button = forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl",
    secondary: "bg-white text-primary-700 border-2 border-primary-200 hover:bg-primary-50 hover:border-primary-300",
    success: "bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 shadow-lg hover:shadow-xl",
    warning: "bg-gradient-to-r from-warning-500 to-warning-600 text-white hover:from-warning-600 hover:to-warning-700 shadow-lg hover:shadow-xl",
    error: "bg-gradient-to-r from-error-500 to-error-600 text-white hover:from-error-600 hover:to-error-700 shadow-lg hover:shadow-xl",
    ghost: "text-primary-700 hover:bg-primary-100 hover:text-primary-800"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm font-medium",
    default: "px-4 py-2.5 text-sm font-semibold",
    lg: "px-6 py-3 text-base font-semibold"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = "Button";

export default Button;