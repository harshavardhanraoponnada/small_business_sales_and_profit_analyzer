import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatNumber } from "../../utils/numberFormat";

const COLORS = {
  Rent: "#ef4444",
  Salary: "#10b981",
  Salaries: "#10b981",
  Electricity: "#f59e0b",
  Internet: "#3b82f6",
  Supplies: "#8b5cf6",
  Refreshments: "#ec4899",
  Maintenance: "#f97316",
  Marketing: "#14b8a6",
  Utilities: "#eab308",
  Misc: "#6b7280"
};

export default function ExpenseCalendar({ expenses, theme, selectedCategory = null }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { daysInMonth, expensesByDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();

    // Generate days array
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }

    // Group expenses by date
    const grouped = {};
    expenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      if (
        expenseDate.getFullYear() === year &&
        expenseDate.getMonth() === month
      ) {
        // Filter by category if selected
        if (selectedCategory && expense.category !== selectedCategory) {
          return;
        }

        const dateKey = expenseDate.getDate();
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            expenses: [],
            total: 0
          };
        }
        grouped[dateKey].expenses.push(expense);
        grouped[dateKey].total += parseFloat(expense.amount) || 0;
      }
    });

    return { daysInMonth: days, expensesByDate: grouped };
  }, [currentDate, expenses, selectedCategory]);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const handleMonthChange = (newMonth) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), parseInt(newMonth))
    );
  };

  const handleYearChange = (newYear) => {
    setCurrentDate(
      new Date(parseInt(newYear), currentDate.getMonth())
    );
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div
      style={{
        backgroundColor: theme.surface,
        borderRadius: "16px",
        padding: "2.5rem",
        border: `1px solid ${theme.border}`,
        boxShadow: theme.isDarkMode
          ? "0 8px 32px rgba(0, 0, 0, 0.3)"
          : "0 8px 32px rgba(0, 0, 0, 0.1)"
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem"
        }}
      >
        <h2
          style={{
            fontSize: "1.75rem",
            fontWeight: "700",
            color: theme.text,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            margin: 0
          }}
        >
          <Calendar size={24} />
          Expense Calendar
          {selectedCategory && (
            <span
              style={{
                fontSize: "1rem",
                backgroundColor: `${COLORS[selectedCategory]}20`,
                color: COLORS[selectedCategory],
                padding: "0.25rem 0.75rem",
                borderRadius: "20px",
                marginLeft: "0.5rem"
              }}
            >
              {selectedCategory}
            </span>
          )}
        </h2>

        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={previousMonth}
            style={{
              backgroundColor: theme.accent,
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            <ChevronLeft size={18} /> Previous
          </button>

          {/* Month Dropdown */}
          <select
            value={currentMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: theme.surface,
              color: theme.text,
              border: `2px solid ${theme.accent}`,
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(theme.accent)}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              paddingRight: "2rem"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.accent;
              e.target.style.boxShadow = `0 0 0 3px ${theme.accent}20`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
            }}
          >
            {months.map((month, idx) => (
              <option key={idx} value={idx}>
                {month}
              </option>
            ))}
          </select>

          {/* Year Dropdown */}
          <select
            value={currentYear}
            onChange={(e) => handleYearChange(e.target.value)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: theme.surface,
              color: theme.text,
              border: `2px solid ${theme.accent}`,
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
              appearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${encodeURIComponent(theme.accent)}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 0.5rem center",
              paddingRight: "2rem"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = theme.accent;
              e.target.style.boxShadow = `0 0 0 3px ${theme.accent}20`;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = "none";
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
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: "600",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "scale(1)";
            }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem",
          marginBottom: "1rem"
        }}
      >
        {dayNames.map((day) => (
          <div
            key={day}
            style={{
              textAlign: "center",
              fontWeight: "700",
              color: theme.text,
              padding: "0.75rem",
              fontSize: "0.9rem"
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "0.5rem"
        }}
      >
        {daysInMonth.map((day, index) => {
          const hasExpenses = day && expensesByDate[day];
          const dayExpenses = hasExpenses ? expensesByDate[day].expenses : [];
          const dayTotal = hasExpenses ? expensesByDate[day].total : 0;

          return (
            <div
              key={index}
              style={{
                minHeight: "120px",
                backgroundColor: day
                  ? hasExpenses
                    ? `${theme.accent}08`
                    : theme.surface
                  : "transparent",
                border: day
                  ? `1px solid ${hasExpenses ? theme.accent : theme.border}`
                  : "none",
                borderRadius: "12px",
                padding: "0.75rem",
                transition: "all 0.2s ease",
                cursor: hasExpenses ? "default" : "default",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (day) {
                  e.currentTarget.style.backgroundColor = `${theme.accent}15`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (day) {
                  e.currentTarget.style.backgroundColor = hasExpenses
                    ? `${theme.accent}08`
                    : theme.surface;
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {day && (
                <>
                  <div
                    style={{
                      fontWeight: "700",
                      color: theme.text,
                      marginBottom: "0.5rem",
                      fontSize: "1rem"
                    }}
                  >
                    {day}
                  </div>

                  {hasExpenses && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.25rem",
                          marginBottom: "0.5rem"
                        }}
                      >
                        {dayExpenses.slice(0, 2).map((expense, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: "0.65rem",
                              backgroundColor: `${COLORS[expense.category] || "#6b7280"}30`,
                              color: COLORS[expense.category] || "#6b7280",
                              padding: "0.2rem 0.4rem",
                              borderRadius: "4px",
                              fontWeight: "600",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis"
                            }}
                          >
                            {expense.category}
                          </div>
                        ))}
                        {dayExpenses.length > 2 && (
                          <div
                            style={{
                              fontSize: "0.65rem",
                              color: theme.textSecondary,
                              fontWeight: "600"
                            }}
                          >
                            +{dayExpenses.length - 2} more
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "700",
                          color: theme.accent,
                          paddingTop: "0.5rem",
                          borderTop: `1px solid ${theme.border}`
                        }}
                      >
                        ₹{formatNumber(dayTotal)}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      {Object.keys(expensesByDate).length > 0 && (
        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            backgroundColor: `${theme.accent}10`,
            borderRadius: "12px",
            border: `1px solid ${theme.border}`
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: theme.textSecondary,
                  marginBottom: "0.5rem"
                }}
              >
                Days with Expenses
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: theme.accent
                }}
              >
                {Object.keys(expensesByDate).length}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: theme.textSecondary,
                  marginBottom: "0.5rem"
                }}
              >
                Total Expenses
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: theme.accent
                }}
              >
                ₹{formatNumber(
                  Object.values(expensesByDate).reduce((sum, day) => sum + day.total, 0)
                )}
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: "0.9rem",
                  color: theme.textSecondary,
                  marginBottom: "0.5rem"
                }}
              >
                Avg per Day
              </div>
              <div
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "800",
                  color: theme.accent
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
      )}
    </div>
  );
}
