import { forwardRef } from "react";
import { cn } from "@/utils/cn";

const Card = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
});

const CardHeader = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-6 pb-4", className)}
      {...props}
    />
  );
});

const CardTitle = forwardRef(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("text-xl font-bold text-slate-900 gradient-text", className)}
      {...props}
    />
  );
});

const CardContent = forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
});

Card.displayName = "Card";
CardHeader.displayName = "CardHeader";
CardTitle.displayName = "CardTitle";
CardContent.displayName = "CardContent";

export default Card;
export { CardHeader, CardTitle, CardContent };