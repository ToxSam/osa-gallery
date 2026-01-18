import * as React from "react";
import { cn } from "../../lib/utils"; // Adjust the import path as necessary

// Switch component with updated logic for controlled state
const Switch = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, checked, onChange, ...props }, ref) => {
    // Handle change logic
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(event); // Pass the change event to the parent handler
      }
    };

    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked} // Controlled component
          onChange={handleChange} // Attach onChange handler
          className="sr-only"
          ref={ref}
          {...props}
        />
        <span
          className={cn(
            "block w-10 h-6 rounded-full bg-gray-200 after:absolute after:top-1 after:left-1 after:bg-cream after:border after:border-gray-300 after:rounded-full after:h-4 after:w-4 after:transition-all",
            checked ? "bg-primar y" : "bg-gray-300",
            checked ? "after:translate-x-4" : "after:translate-x-0",
            className
          )}
        />
      </label>
    );
  }
);

Switch.displayName = "Switch";
export { Switch };
