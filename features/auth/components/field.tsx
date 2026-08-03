import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  errors?: string[];
}

/** A labelled input with inline validation feedback, reused across forms. */
export function Field({ label, name, id, errors, ...props }: FieldProps) {
  const inputId = id ?? name;
  const hasError = Boolean(errors && errors.length > 0);
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        name={name}
        aria-invalid={hasError}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      {hasError ? (
        <p id={errorId} className="text-xs text-destructive">
          {errors?.[0]}
        </p>
      ) : null}
    </div>
  );
}
