import type { InputProps } from '@/types';
import { AppInput } from './AppInput';

/**
 * Public project input API for forms and filters.
 */
export function Input(props: InputProps) {
  return <AppInput {...props} />;
}
