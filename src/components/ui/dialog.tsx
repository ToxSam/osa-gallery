import * as React from "react";
import { cn } from "../../lib/utils"; // Adjust the import path as necessary

// Dialog component
const Dialog = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Dialog.displayName = "Dialog";
export { Dialog };

// DialogContent component
const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn(
          "bg-cream dark:bg-gray-900 p-6 rounded-lg shadow-lg w-full max-w-lg",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogContent.displayName = "DialogContent";
export { DialogContent };

// DialogHeader component
const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("text-xl font-semibold text-gray-900", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogHeader.displayName = "DialogHeader";
export { DialogHeader };

// DialogTitle component
const DialogTitle = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("text-2xl font-semibold text-gray-900", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogTitle.displayName = "DialogTitle";
export { DialogTitle };

// DialogFooter component
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("flex justify-end space-x-4", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogFooter.displayName = "DialogFooter";
export { DialogFooter };

// DialogTrigger component
const DialogTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
    ({ className, children, asChild, ...props }, ref) => {
      // If asChild is true, render the children directly (without wrapping in a button)
      if (asChild) {
        return <>{children}</>;
      }
  
      // Otherwise, render a normal button
      return (
        <button
          className={cn("text-primary hover:text-primary/90", className)}
          ref={ref}
          {...props}
        >
          {children}
        </button>
      );
    }
  );
  
  DialogTrigger.displayName = "DialogTrigger";
  export { DialogTrigger };

// DialogDescription component
const DialogDescription = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("text-gray-600", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DialogDescription.displayName = "DialogDescription";
export { DialogDescription };

// DialogClose component
const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn("text-primary hover:text-primary/90", className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DialogClose.displayName = "DialogClose";
export { DialogClose };
