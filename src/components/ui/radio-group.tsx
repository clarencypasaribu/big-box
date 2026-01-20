import * as React from "react";

import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  name: string;
  value: string;
  setValue: (value: string) => void;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

type RadioGroupProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ value, defaultValue, onValueChange, name, className, children, ...props }, ref) => {
    const [internal, setInternal] = React.useState(defaultValue ?? "");
    const isControlled = value !== undefined;
    const current = isControlled ? value : internal;
    const groupName = React.useId();

    const handleChange = (next: string) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    };

    return (
      <RadioGroupContext.Provider
        value={{
          name: name || groupName,
          value: current ?? "",
          setValue: handleChange,
        }}
      >
        <div
          role="radiogroup"
          ref={ref}
          className={cn("grid gap-2", className)}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

type RadioGroupItemProps = {
  value: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ value, className, onChange, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext);
    if (!ctx) {
      throw new Error("RadioGroupItem must be used within RadioGroup");
    }
    const checked = ctx.value === value;

    return (
      <input
        type="radio"
        ref={ref}
        name={ctx.name}
        value={value}
        checked={checked}
        onChange={(event) => {
          ctx.setValue(value);
          onChange?.(event);
        }}
        className={cn(
          "h-4 w-4 cursor-pointer rounded-full border border-slate-300 text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500",
          className
        )}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";
