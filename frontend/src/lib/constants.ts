import type { ConditionalOperator, FormFieldType } from "./types";

export const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string; hasOptions: boolean }[] = [
  { value: "TEXT", label: "Text", hasOptions: false },
  { value: "NUMBER", label: "Number", hasOptions: false },
  { value: "EMAIL", label: "Email", hasOptions: false },
  { value: "DATE", label: "Date", hasOptions: false },
  { value: "DROPDOWN", label: "Dropdown", hasOptions: true },
  { value: "CHECKBOX", label: "Checkbox", hasOptions: true },
  { value: "RADIO", label: "Radio", hasOptions: true },
  { value: "FILE", label: "File", hasOptions: false },
  { value: "RATING", label: "Rating", hasOptions: false },
];

export const FIELD_TYPE_LABEL: Record<FormFieldType, string> = Object.fromEntries(
  FIELD_TYPE_OPTIONS.map((o) => [o.value, o.label]),
) as Record<FormFieldType, string>;

export function fieldTypeHasOptions(type: FormFieldType): boolean {
  return FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.hasOptions ?? false;
}

export const CONDITIONAL_OPERATOR_OPTIONS: { value: ConditionalOperator; label: string }[] = [
  { value: "EQUALS", label: "equals" },
  { value: "NOT_EQUALS", label: "does not equal" },
  { value: "CONTAINS", label: "contains" },
  { value: "GREATER_THAN", label: "is greater than" },
  { value: "LESS_THAN", label: "is less than" },
  { value: "GREATER_THAN_OR_EQUAL", label: "is at least" },
  { value: "LESS_THAN_OR_EQUAL", label: "is at most" },
];
