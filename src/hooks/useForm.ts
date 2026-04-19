import { useForm as useReactHookForm, type DefaultValues, type FieldValues, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';

interface UseFormOptions<TFieldValues extends FieldValues> {
  schema: ZodType<TFieldValues>;
  onSubmit: SubmitHandler<TFieldValues>;
  initialValues?: DefaultValues<TFieldValues>;
}

export const useForm = <TFieldValues extends FieldValues>({
  schema,
  onSubmit,
  initialValues,
}: UseFormOptions<TFieldValues>) => {
  const methods = useReactHookForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  return {
    methods,
    formState: methods.formState,
    handleSubmit: methods.handleSubmit(onSubmit),
  };
};
