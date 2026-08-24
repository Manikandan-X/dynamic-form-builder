import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useId } from "react";

interface ShellProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}

export function FieldShell({ label, hint, error, required, children, htmlFor }: ShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-ink-soft">
          {label} {required && <span className="text-rust">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && <p className="text-xs font-medium text-rust">{error}</p>}
    </div>
  );
}

const baseInputClasses =
  "w-full rounded-md border border-hairline-strong bg-card-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ledger focus:outline-none focus:ring-2 focus:ring-ledger/20 disabled:opacity-50";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, required, className = "", id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`${baseInputClasses} ${error ? "border-rust" : ""} ${className}`}
          {...rest}
        />
      </FieldShell>
    );
  },
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, required, className = "", id, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          className={`${baseInputClasses} min-h-[88px] resize-y ${error ? "border-rust" : ""} ${className}`}
          {...rest}
        />
      </FieldShell>
    );
  },
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, required, className = "", id, children, ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <FieldShell label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
        <select
          ref={ref}
          id={inputId}
          required={required}
          className={`${baseInputClasses} ${error ? "border-rust" : ""} ${className}`}
          {...rest}
        >
          {children}
        </select>
      </FieldShell>
    );
  },
);
Select.displayName = "Select";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, id, className = "", ...rest }, ref) => {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <label htmlFor={inputId} className="flex cursor-pointer items-start gap-2.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={`mt-0.5 h-4 w-4 shrink-0 rounded-sm border-hairline-strong text-ledger focus:ring-ledger/30 ${className}`}
          {...rest}
        />
        <span>
          <span className="block text-sm text-ink">{label}</span>
          {description && <span className="block text-xs text-ink-faint">{description}</span>}
        </span>
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
