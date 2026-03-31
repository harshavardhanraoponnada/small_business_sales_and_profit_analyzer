import type { FieldErrors, FieldValues, Path } from 'react-hook-form';

const getNestedValue = (obj: unknown, path: string) => {
  if (!obj) return undefined;

  return path
    .split('.')
    .reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[key] : undefined), obj);
};

export const useFormErrors = <TFieldValues extends FieldValues>(errors: FieldErrors<TFieldValues>) => {
  const getError = (fieldName: Path<TFieldValues>) => {
    const fieldError = getNestedValue(errors, fieldName as string) as { message?: string } | undefined;
    return fieldError?.message;
  };

  const hasError = (fieldName: Path<TFieldValues>) => Boolean(getError(fieldName));

  return {
    errors,
    getError,
    hasError,
    hasAnyError: Object.keys(errors).length > 0,
  };
};
