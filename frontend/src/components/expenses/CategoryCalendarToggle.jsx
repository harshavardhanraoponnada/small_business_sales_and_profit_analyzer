import { useState } from "react";
import { X, Grid3X3 } from "lucide-react";
import ExpenseCalendar from "./ExpenseCalendar";

export default function CategoryCalendarToggle({ expenses, theme, categoryData }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategorySelector, setShowCategorySelector] = useState(false);

  // Get unique categories from data
  const categories = categoryData ? categoryData.map((c) => c.category) : [];

  return (
    <div>
      {/* Category Filter Buttons */}
      <div
        style={{
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap"
        }}
      >
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            border: selectedCategory === null ? "2px solid" : "1px solid",
            borderColor: selectedCategory === null ? theme.accent : theme.border,
            backgroundColor:
              selectedCategory === null ? `${theme.accent}20` : theme.surface,
            color: selectedCategory === null ? theme.accent : theme.text,
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontSize: "0.9rem"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
          }}
        >
          <Grid3X3 size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
          All Expenses
        </button>

        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              setSelectedCategory(selectedCategory === category ? null : category)
            }
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border:
                selectedCategory === category ? "2px solid" : "1px solid",
              borderColor:
                selectedCategory === category ? theme.accent : theme.border,
              backgroundColor:
                selectedCategory === category ? `${theme.accent}20` : theme.surface,
              color: selectedCategory === category ? theme.accent : theme.text,
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s ease",
              fontSize: "0.9rem"
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Calendar */}
      <ExpenseCalendar
        expenses={expenses}
        theme={theme}
        selectedCategory={selectedCategory}
      />
    </div>
  );
}
