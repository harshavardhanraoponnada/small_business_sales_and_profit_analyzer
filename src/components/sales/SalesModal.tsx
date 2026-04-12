import { Modal } from '@/components/ui';
import SalesForm from './SalesForm';

interface SalesModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialSale?: any;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSave: (payload: { customer_name?: string; variant_id?: string; quantity: number; unit_price: number; notes?: string }) => Promise<void>;
}

export default function SalesModal({ isOpen, mode, initialSale, loading, error, onClose, onSave }: SalesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add Sale' : 'Edit Sale'}
      size="lg"
    >
      <SalesForm
        mode={mode}
        initialSale={initialSale}
        loading={loading}
        submitError={error}
        onCancel={onClose}
        onSubmit={onSave}
      />
    </Modal>
  );
}
