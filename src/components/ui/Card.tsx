import type { CardProps } from '@/types';
import { AppCard } from './AppCard';

/**
 * Public project card API with variant support.
 */
export function Card(props: CardProps) {
  return <AppCard {...props} />;
}
