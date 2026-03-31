import type { AlertProps } from '@/types';
import { AppAlert } from './AppAlert';

/**
 * Public project alert API for semantic status messages.
 */
export function Alert(props: AlertProps) {
  return <AppAlert {...props} />;
}
