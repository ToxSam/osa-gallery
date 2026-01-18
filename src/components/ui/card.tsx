import * as React from "react";
import { cn } from "../../lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn("rounded-lg shadow-md bg-cream dark:bg-gray-900 p-4", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn("border-b pb-2 mb-2 font-bold text-lg", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardHeader.displayName = "CardHeader";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn("text-gray-700", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardContent.displayName = "CardContent";

// Add the missing CardTitle component
const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h2
        className={cn("text-xl font-semibold leading-none tracking-tight", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return (
      <p
        className={cn("text-sm text-muted-foreground", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
CardDescription.displayName = "CardDescription";

// Export all components
export { Card, CardHeader, CardContent, CardTitle, CardDescription };
