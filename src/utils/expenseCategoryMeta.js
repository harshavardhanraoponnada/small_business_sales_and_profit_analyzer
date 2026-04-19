const SYSTEM_CATEGORY_META_BY_KEY = Object.freeze({
  BUYING_STOCKS: { color: "#0ea5e9", icon: "📦" },
  SHOP_RENT: { color: "#ef4444", icon: "🏠" },
  ELECTRICITY_BILL: { color: "#f59e0b", icon: "⚡" },
  STAFF_SALARIES: { color: "#10b981", icon: "💰" },
  INTERNET_CHARGES: { color: "#3b82f6", icon: "🌐" },
  REPAIR_MAINTENANCE: { color: "#f97316", icon: "🔧" },
  MARKETING_ADVERTISING: { color: "#14b8a6", icon: "📢" },
  GST_COMPLIANCE_COSTS: { color: "#eab308", icon: "🧾" },
  PACKAGING_SMALL_ACCESSORIES: { color: "#6366f1", icon: "🎁" },
  OTHER: { color: "#6b7280", icon: "📌" },
});

const FALLBACK_COLORS = Object.freeze([
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#6366f1",
  "#ec4899",
  "#ef4444",
  "#14b8a6",
  "#8b5cf6",
  "#f97316",
  "#6b7280",
]);

const normalizeText = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const normalizeKey = (value) => {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

const hashToColor = (value) => {
  const source = String(value || "Other");
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
  }

  const normalized = Math.abs(hash) % FALLBACK_COLORS.length;
  return FALLBACK_COLORS[normalized];
};

const buildExpenseCategoryMeta = (category) => {
  const normalizedKey = normalizeKey(category?.key || category?.name);
  const systemMeta = SYSTEM_CATEGORY_META_BY_KEY[normalizedKey] || SYSTEM_CATEGORY_META_BY_KEY.OTHER;

  return {
    key: normalizedKey || "OTHER",
    name: String(category?.name || "Other"),
    color: category?.color || systemMeta.color || hashToColor(category?.name || category?.key),
    icon: category?.icon || systemMeta.icon || "📌",
  };
};

export const buildExpenseCategoryMetaMap = (categories = []) => {
  const categoryMetaMap = {};

  for (const category of categories) {
    const meta = buildExpenseCategoryMeta(category || {});
    const normalizedName = normalizeText(meta.name);

    if (normalizedName) {
      categoryMetaMap[normalizedName] = meta;
    }

    const normalizedKey = normalizeText(meta.key);
    if (normalizedKey) {
      categoryMetaMap[normalizedKey] = meta;
    }
  }

  return categoryMetaMap;
};

export const getExpenseCategoryMeta = (categoryName, categoryMetaMap = {}) => {
  const normalizedName = normalizeText(categoryName);
  if (normalizedName && categoryMetaMap[normalizedName]) {
    return categoryMetaMap[normalizedName];
  }

  return buildExpenseCategoryMeta({ name: String(categoryName || "Other") });
};
