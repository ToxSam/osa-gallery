import * as React from "react";
import { cn } from "../../lib/utils"; // Adjust the import path as necessary

// SelectTrigger: The button that triggers the select dropdown
const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        className={cn("px-4 py-2 border rounded-md bg-cream dark:bg-gray-900 text-gray-700 dark:text-gray-300", className)}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";
export { SelectTrigger };

// SelectValue: Displays the currently selected value
const SelectValue = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("px-3 py-2 text-sm text-gray-700", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectValue.displayName = "SelectValue";
export { SelectValue };

// SelectContent: The dropdown menu that shows items
const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        className={cn("bg-cream dark:bg-gray-900 shadow-lg rounded-md w-full", className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectContent.displayName = "SelectContent";
export { SelectContent };

// SelectItem: An individual item within the select dropdown
interface SelectItemProps {
  value: string | number | readonly string[] | undefined;
  onClick?: (value: string | number | readonly string[] | undefined) => void;
  className?: string;
  children: React.ReactNode;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, value, onClick, ...props }, ref) => {
    const handleItemClick = () => {
      if (onClick) {
        onClick(value); // Call onClick with the value when the item is clicked
      }
    };

    return (
      <div
        className={cn("px-3 py-2 text-sm cursor-pointer hover:bg-gray-200", className)}
        ref={ref}
        onClick={handleItemClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";
export { SelectItem };

// Select: The main wrapper component that holds all other components
interface SelectProps {
  className?: string;
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string | number | readonly string[] | undefined) => void;
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, value, onValueChange, ...props }, ref) => {
    // Wrapping children to pass on the value change functionality
    return (
      <div className={cn("relative", className)} ref={ref} {...props}>
        {React.Children.map(children, (child) => {
          // Ensure the child is a valid element and a SelectItem component
          if (
            React.isValidElement(child) &&
            (child.type as React.ComponentType<any>).displayName === "SelectItem"
          ) {
            // Ensure that the child is typed as SelectItemProps before adding the onClick prop
            return React.cloneElement(child as React.ReactElement<SelectItemProps>, {
              onClick: (value: string | number | readonly string[] | undefined) => onValueChange(value), // Accept the broader type here
            });
          }
          return child;
        })}
        {children}
      </div>
    );
  }
);

Select.displayName = "Select";
export { Select };
