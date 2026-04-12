import { Modal } from '@/components/ui';
import ExpenseForm from './ExpenseForm';

interface ExpensesModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  initialExpense?: any;
  categories: Array<{ label: string; value: string }>;
  paymentMethods: Array<{ label: string; value: string }>;
  loading?: boolean;
  onClose: () => void;
  onSave: (payload: {
    category: string;
    date: string;
    amount: number;
    vendor_name: string;
    invoice_reference: string;
    tax_amount: number;
    payment_method: string;
    affects_cogs_override?: boolean | null;
    description: string;
    file?: File | null;
  }) => Promise<void>;
}

export default function ExpensesModal({
  isOpen,
  mode,
  initialExpense,
  categories,
  paymentMethods,
  loading,
  onClose,
  onSave,
}: ExpensesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add Expense' : 'Edit Expense'}
      size="lg"
    >
      <ExpenseForm
        mode={mode}
        initialExpense={initialExpense}
        categories={categories}
        paymentMethods={paymentMethods}
        loading={loading}
        onCancel={onClose}
        onSubmit={onSave}
      />
    </Modal>
  );
}
