import type { SelectProps } from '@/types';
import { AppSelect } from './AppSelect';

/**
 * Public project select API with typed options support.
 */
export function Select(props: SelectProps) {
  return <AppSelect {...props} />;
}
