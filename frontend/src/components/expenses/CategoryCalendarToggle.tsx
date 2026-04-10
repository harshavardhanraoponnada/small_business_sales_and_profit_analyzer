import { useMemo, useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import ExpenseCalendar from './ExpenseCalendar';
import type {
  CategoryAmount,
  ExpenseCategoryMetaMap,
  ExpenseLike,
  ExpenseThemePalette,
} from './types';

type CategoryCalendarToggleProps = {
  expenses: ExpenseLike[];
  theme: ExpenseThemePalette;
  categoryData: CategoryAmount[];
  categoryMetaMap?: ExpenseCategoryMetaMap;
};

export default function CategoryCalendarToggle({
  expenses,
  theme,
  categoryData,
  categoryMetaMap = {},
}: CategoryCalendarToggleProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => (categoryData ? categoryData.map((item) => item.category) : []),
    [categoryData]
  );

  return (
    <div>
      <div
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: '0.55rem 1.05rem',
            borderRadius: '999px',
            border: selectedCategory === null ? '2px solid' : '1px solid',
            borderColor: selectedCategory === null ? theme.accent : theme.border,
            backgroundColor: selectedCategory === null ? `${theme.accent}24` : theme.surface,
            color: selectedCategory === null ? theme.accent : theme.text,
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '0.85rem',
            letterSpacing: '0.01em',
            boxShadow:
              selectedCategory === null
                ? `0 8px 20px ${theme.accent}30`
                : '0 6px 16px rgba(15,23,42,0.10)',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Grid3X3 size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
          All Expenses
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            style={{
              padding: '0.55rem 1.05rem',
              borderRadius: '999px',
              border: selectedCategory === category ? '2px solid' : '1px solid',
              borderColor: selectedCategory === category ? theme.accent : theme.border,
              backgroundColor: selectedCategory === category ? `${theme.accent}24` : theme.surface,
              color: selectedCategory === category ? theme.accent : theme.text,
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '0.85rem',
              letterSpacing: '0.01em',
              boxShadow:
                selectedCategory === category
                  ? `0 8px 20px ${theme.accent}30`
                  : '0 6px 16px rgba(15,23,42,0.10)',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {category}
          </button>
        ))}
      </div>

      <ExpenseCalendar
        expenses={expenses}
        theme={theme}
        selectedCategory={selectedCategory}
        categoryMetaMap={categoryMetaMap}
      />
    </div>
  );
}
