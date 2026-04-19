import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/utils/numberFormat';
import { getExpenseCategoryMeta } from '@/utils/expenseCategoryMeta';
import type { ExpenseCategoryMetaMap, ExpenseLike, ExpenseThemePalette } from './types';

type ExpenseCalendarProps = {
  expenses: ExpenseLike[];
  theme: ExpenseThemePalette;
  selectedCategory?: string | null;
  categoryMetaMap?: ExpenseCategoryMetaMap;
};

type ExpenseByDate = {
  expenses: ExpenseLike[];
  total: number;
};

export default function ExpenseCalendar({
  expenses,
  theme,
  selectedCategory = null,
  categoryMetaMap = {},
}: ExpenseCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { daysInMonth, expensesByDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();

    const days: Array<number | null> = [];
    for (let index = 0; index < firstDay; index += 1) {
      days.push(null);
    }
    for (let day = 1; day <= daysCount; day += 1) {
      days.push(day);
    }

    const grouped: Record<number, ExpenseByDate> = {};
    expenses.forEach((expense) => {
      if (!expense.date) {
        return;
      }

      const expenseDate = new Date(expense.date);
      if (Number.isNaN(expenseDate.getTime())) {
        return;
      }

      if (expenseDate.getFullYear() === year && expenseDate.getMonth() === month) {
        if (selectedCategory && expense.category !== selectedCategory) {
          return;
        }

        const dateKey = expenseDate.getDate();
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            expenses: [],
            total: 0,
          };
        }

        grouped[dateKey].expenses.push(expense);
        grouped[dateKey].total += Number(expense.amount || 0);
      }
    });

    return { daysInMonth: days, expensesByDate: grouped };
  }, [currentDate, expenses, selectedCategory]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleMonthChange = (newMonth: string) => {
    setCurrentDate(new Date(currentDate.getFullYear(), Number.parseInt(newMonth, 10)));
  };

  const handleYearChange = (newYear: string) => {
    setCurrentDate(new Date(Number.parseInt(newYear, 10), currentDate.getMonth()));
  };

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const years = Array.from({ length: 10 }, (_, index) => currentYear - 5 + index);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: '16px',
        padding: '2.5rem',
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDarkMode
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: theme.text,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            margin: 0,
          }}
        >
          <Calendar size={24} />
          Expense Calendar
          {selectedCategory ? (
            <span
              style={{
                fontSize: '1rem',
                backgroundColor: `${getExpenseCategoryMeta(selectedCategory, categoryMetaMap).color}20`,
                color: getExpenseCategoryMeta(selectedCategory, categoryMetaMap).color,
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                marginLeft: '0.5rem',
              }}
            >
              {selectedCategory}
            </span>
          ) : null}
        </h2>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={previousMonth}
            style={{
              backgroundColor: theme.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <ChevronLeft size={18} /> Previous
          </button>

          <select
            value={currentMonth}
            onChange={(event) => handleMonthChange(event.target.value)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.surface,
              color: theme.text,
              border: `2px solid ${theme.accent}`,
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(theme.accent)}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              paddingRight: '2rem',
            }}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = theme.accent;
              event.currentTarget.style.boxShadow = `0 0 0 3px ${theme.accent}20`;
            }}
            onBlur={(event) => {
              event.currentTarget.style.boxShadow = 'none';
            }}
          >
            {months.map((month, idx) => (
              <option key={month} value={idx}>
                {month}
              </option>
            ))}
          </select>

          <select
            value={currentYear}
            onChange={(event) => handleYearChange(event.target.value)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: theme.surface,
              color: theme.text,
              border: `2px solid ${theme.accent}`,
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              appearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(theme.accent)}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              paddingRight: '2rem',
            }}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = theme.accent;
              event.currentTarget.style.boxShadow = `0 0 0 3px ${theme.accent}20`;
            }}
            onBlur={(event) => {
              event.currentTarget.style.boxShadow = 'none';
            }}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            onClick={nextMonth}
            style={{
              backgroundColor: theme.accent,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: '700',
              color: theme.text,
              padding: '0.75rem',
              fontSize: '0.9rem',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem',
        }}
      >
        {daysInMonth.map((day, index) => {
          const hasExpenses = day !== null && Boolean(expensesByDate[day]);
          const dayExpenses = day !== null && hasExpenses ? expensesByDate[day].expenses : [];
          const dayTotal = day !== null && hasExpenses ? expensesByDate[day].total : 0;

          return (
            <div
              key={`${day ?? 'empty'}-${index}`}
              style={{
                minHeight: '120px',
                backgroundColor:
                  day !== null
                    ? hasExpenses
                      ? `${theme.accent}08`
                      : theme.surface
                    : 'transparent',
                border:
                  day !== null
                    ? `1px solid ${hasExpenses ? theme.accent : theme.border}`
                    : 'none',
                borderRadius: '12px',
                padding: '0.75rem',
                transition: 'all 0.2s ease',
                cursor: 'default',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(event) => {
                if (day !== null) {
                  event.currentTarget.style.backgroundColor = `${theme.accent}15`;
                  event.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(event) => {
                if (day !== null) {
                  event.currentTarget.style.backgroundColor = hasExpenses ? `${theme.accent}08` : theme.surface;
                  event.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {day !== null ? (
                <>
                  <div
                    style={{
                      fontWeight: '700',
                      color: theme.text,
                      marginBottom: '0.5rem',
                      fontSize: '1rem',
                    }}
                  >
                    {day}
                  </div>

                  {hasExpenses ? (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {dayExpenses.slice(0, 2).map((expense, expenseIndex) => {
                          const categoryColor = getExpenseCategoryMeta(expense.category, categoryMetaMap).color;

                          return (
                            <div
                              key={`${expense.id ?? 'expense'}-${expenseIndex}`}
                              style={{
                                fontSize: '0.65rem',
                                backgroundColor: `${categoryColor}30`,
                                color: categoryColor,
                                padding: '0.2rem 0.4rem',
                                borderRadius: '4px',
                                fontWeight: '600',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {expense.category || 'Other'}
                            </div>
                          );
                        })}
                        {dayExpenses.length > 2 ? (
                          <div
                            style={{
                              fontSize: '0.65rem',
                              color: theme.textSecondary,
                              fontWeight: '600',
                            }}
                          >
                            +{dayExpenses.length - 2} more
                          </div>
                        ) : null}
                      </div>

                      <div
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          color: theme.accent,
                          paddingTop: '0.5rem',
                          borderTop: `1px solid ${theme.border}`,
                        }}
                      >
                        ₹{formatNumber(dayTotal)}
                      </div>
                    </>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {Object.keys(expensesByDate).length > 0 ? (
        <div
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: `${theme.accent}10`,
            borderRadius: '12px',
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: theme.textSecondary,
                  marginBottom: '0.5rem',
                }}
              >
                Days with Expenses
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: theme.accent,
                }}
              >
                {Object.keys(expensesByDate).length}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: theme.textSecondary,
                  marginBottom: '0.5rem',
                }}
              >
                Total Expenses
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: theme.accent,
                }}
              >
                ₹
                {formatNumber(
                  Object.values(expensesByDate).reduce((sum, day) => sum + day.total, 0)
                )}
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.9rem',
                  color: theme.textSecondary,
                  marginBottom: '0.5rem',
                }}
              >
                Avg per Day
              </div>
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '800',
                  color: theme.accent,
                }}
              >
                ₹
                {formatNumber(
                  Object.values(expensesByDate).reduce((sum, day) => sum + day.total, 0) /
                    Object.keys(expensesByDate).length
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
