import * as React from "react";
import { cn } from "../../lib/utils";

// Define badge variants
const badgeVariants = {
  primary: "bg-primary text-primary-foreground",
  secondary: "bg-gray-500 text-white", // Example secondary variant
  success: "bg-green-500 text-white",
  danger: "bg-red-500 text-white",
  outline: "border border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-300",
  // Add more variants as needed
};

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant: keyof typeof badgeVariants; // Ensure variant is one of the defined options
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ variant, className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium", 
          badgeVariants[variant], // Apply the styles for the selected variant
          className // Allow for custom classes
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
