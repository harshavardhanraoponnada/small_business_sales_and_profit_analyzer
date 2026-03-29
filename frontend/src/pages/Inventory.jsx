import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../auth/authContext";
import { useTheme } from "../app/ThemeContext";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import { formatNumber } from "../utils/numberFormat";

export default function Inventory() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);

  const [form, setForm] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  const canEdit = user.role === "OWNER" || user.role === "ACCOUNTANT";

  // Theme
  const themeColors = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    surface: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    accent: "#3b82f6",
    error: "#ef4444",
    success: "#10b981"
  };

  /* ===== LOAD DATA ===== */
  useEffect(() => {
    api.get(`/categories?includeDeleted=${showDeleted}`).then(res => setCategories(res.data));
  }, [showDeleted]);

  useEffect(() => {
    if (!selectedCategory) return;
    api.get(`/brands?categoryId=${selectedCategory.id}&includeDeleted=${showDeleted}`)
      .then(res => setBrands(res.data));
    setSelectedBrand(null);
    setSelectedModel(null);
    setVariants([]);
  }, [selectedCategory, showDeleted]);

  useEffect(() => {
    if (!selectedBrand) return;
    api.get(`/models?brandId=${selectedBrand.id}&includeDeleted=${showDeleted}`)
      .then(res => setModels(res.data));
    setSelectedModel(null);
    setVariants([]);
  }, [selectedBrand, showDeleted]);

  useEffect(() => {
    if (!selectedModel) return;
    api.get(`/variants?modelId=${selectedModel.id}&includeDeleted=${showDeleted}`)
      .then(res => setVariants(res.data));
  }, [selectedModel, showDeleted]);

  /* ===== SAVE HANDLER ===== */
  const save = async () => {
    try {
      console.log("Form data:", JSON.stringify(form, null, 2));
      // Prepare the data for submission
      const submitData = { ...form.data };
      
      // Convert numeric fields to proper types
      if (submitData.stock !== undefined) {
        submitData.stock = Number(submitData.stock);
      }
      if (submitData.purchase_price !== undefined) {
        submitData.purchase_price = Number(submitData.purchase_price);
      }
      if (submitData.selling_price !== undefined) {
        submitData.selling_price = Number(submitData.selling_price);
      }
      if (submitData.reorder_level !== undefined) {
        submitData.reorder_level = Number(submitData.reorder_level);
      }
      
      console.log("Submit data:", JSON.stringify(submitData, null, 2));
      
      if (form.method === "PUT") {
        console.log(`Calling PUT: ${form.endpoint}/${form.id}`, submitData);
        await api.put(`${form.endpoint}/${form.id}`, submitData);
      } else {
        console.log(`Calling POST: ${form.endpoint}`, submitData);
        await api.post(form.endpoint, submitData);
      }
      setForm(null);

      if (form.endpoint === "/categories") {
        const res = await api.get(`/categories?includeDeleted=${showDeleted}`);
        setCategories(res.data);
      }
      if (form.endpoint === "/brands") {
        const res = await api.get(`/brands?categoryId=${selectedCategory.id}&includeDeleted=${showDeleted}`);
        setBrands(res.data);
      }
      if (form.endpoint === "/models") {
        const res = await api.get(`/models?brandId=${selectedBrand.id}&includeDeleted=${showDeleted}`);
        setModels(res.data);
      }
      if (form.endpoint === "/variants") {
        const res = await api.get(`/variants?modelId=${selectedModel.id}&includeDeleted=${showDeleted}`);
        setVariants(res.data);
      }
    } catch (error) {
      console.error("Error saving:", error);
      if (error.response?.data?.message) {
        alert(`Error: ${error.response.data.message}`);
      } else {
        alert("Error saving. Please try again.");
      }
    }
  };

  const handleDelete = async (endpoint, id, itemType) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      
      if (itemType === "category") {
        const res = await api.get(`/categories?includeDeleted=${showDeleted}`);
        setCategories(res.data);
        setSelectedCategory(null);
      } else if (itemType === "brand") {
        const res = await api.get(`/brands?categoryId=${selectedCategory.id}&includeDeleted=${showDeleted}`);
        setBrands(res.data);
        setSelectedBrand(null);
      } else if (itemType === "model") {
        const res = await api.get(`/models?brandId=${selectedBrand.id}&includeDeleted=${showDeleted}`);
        setModels(res.data);
        setSelectedModel(null);
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting. Please try again.");
    }
  };

  const handleRestore = async (endpoint, id, itemType) => {
    try {
      await api.patch(`${endpoint}/${id}/restore`);
      
      if (itemType === "category") {
        const res = await api.get(`/categories?includeDeleted=${showDeleted}`);
        setCategories(res.data);
      } else if (itemType === "brand") {
        const res = await api.get(`/brands?categoryId=${selectedCategory.id}&includeDeleted=${showDeleted}`);
        setBrands(res.data);
      } else if (itemType === "model") {
        const res = await api.get(`/models?brandId=${selectedBrand.id}&includeDeleted=${showDeleted}`);
        setModels(res.data);
      }
    } catch (error) {
      console.error("Error restoring:", error);
      alert("Error restoring. Please try again.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: isDarkMode
          ? "#0f172a"
          : "#f8fafc"
      }}
    >
      <Sidebar />

      <div style={{ flex: 1, marginLeft: "280px" }}>
        <Header title="Inventory" />

        <div style={{ padding: "2rem" }}>
          {user.role === "OWNER" && (
            <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label style={{ color: themeColors.text, fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  style={{ marginRight: "0.5rem", cursor: "pointer" }}
                />
                Show Deleted Items
              </label>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 220px 220px 1fr",
              gap: "1rem"
            }}
          >
            <Section
              key="categories"
              title="Categories"
              theme={themeColors}
              canAdd={canEdit && !showDeleted}
              onAdd={() => setForm({ method: "POST", endpoint: "/categories", data: { name: "" } })}
            >
              {categories.map(c => (
                <ItemWithActions
                  key={c.id}
                  label={c.name}
                  deleted={c.is_deleted === "true"}
                  active={selectedCategory?.id === c.id}
                  onClick={() => !showDeleted && setSelectedCategory(c)}
                  theme={themeColors}
                  onEdit={user.role === "OWNER" && !showDeleted ? () => setForm({ method: "PUT", id: c.id, endpoint: "/categories", data: { name: c.name } }) : null}
                  onDelete={user.role === "OWNER" && !showDeleted ? () => {
                    if (window.confirm("Are you sure you want to delete this category?")) {
                      handleDelete("/categories", c.id, "category");
                    }
                  } : null}
                  onRestore={user.role === "OWNER" && showDeleted && c.is_deleted === "true" ? () => handleRestore("/categories", c.id, "category") : null}
                />
              ))}
            </Section>

            <Section
              key="brands"
              title="Brands"
              theme={themeColors}
              canAdd={canEdit && selectedCategory && !showDeleted}
              onAdd={() =>
                setForm({
                  method: "POST",
                  endpoint: "/brands",
                  data: {
                    name: "",
                    category_id: selectedCategory.id
                  }
                })
              }
            >
              {brands.length === 0 && !showDeleted && (
                <Empty text="Select category first" theme={themeColors} />
              )}
              {brands.map(b => (
                <ItemWithActions
                  key={b.id}
                  label={b.name}
                  deleted={b.is_deleted === "true"}
                  active={selectedBrand?.id === b.id}
                  onClick={() => !showDeleted && setSelectedBrand(b)}
                  theme={themeColors}
                  onEdit={user.role === "OWNER" && !showDeleted ? () => setForm({ method: "PUT", id: b.id, endpoint: "/brands", data: { name: b.name, category_id: b.category_id } }) : null}
                  onDelete={user.role === "OWNER" && !showDeleted ? () => {
                    if (window.confirm("Are you sure you want to delete this brand?")) {
                      handleDelete("/brands", b.id, "brand");
                    }
                  } : null}
                  onRestore={user.role === "OWNER" && showDeleted && b.is_deleted === "true" ? () => handleRestore("/brands", b.id, "brand") : null}
                />
              ))}
            </Section>

            <Section
              title="Models"
              theme={themeColors}
              canAdd={canEdit && selectedBrand && !showDeleted}
              onAdd={() =>
                setForm({
                  method: "POST",
                  endpoint: "/models",
                  data: {
                    name: "",
                    brand_id: selectedBrand.id
                  }
                })
              }
            >
              {models.length === 0 && !showDeleted && (
                <Empty text="Select brand first" theme={themeColors} />
              )}
              {models.map(m => (
                <ItemWithActions
                  key={m.id}
                  label={m.name}
                  deleted={m.is_deleted === "true"}
                  active={selectedModel?.id === m.id}
                  onClick={() => !showDeleted && setSelectedModel(m)}
                  theme={themeColors}
                  onEdit={user.role === "OWNER" && !showDeleted ? () => setForm({ method: "PUT", id: m.id, endpoint: "/models", data: { name: m.name, brand_id: m.brand_id } }) : null}
                  onDelete={user.role === "OWNER" && !showDeleted ? () => {
                    if (window.confirm("Are you sure you want to delete this model?")) {
                      handleDelete("/models", m.id, "model");
                    }
                  } : null}
                  onRestore={user.role === "OWNER" && showDeleted && m.is_deleted === "true" ? () => handleRestore("/models", m.id, "model") : null}
                />
              ))}
            </Section>

            <Section key="variants" title="Variants" theme={themeColors}>
              <p style={{ fontSize: "0.85rem", color: themeColors.textSecondary }}>
                {selectedCategory?.name || "Select Category"} →
                {selectedBrand?.name || " Select Brand"} →
                {selectedModel?.name || " Select Model"}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.5rem"
                }}
              >
                <strong style={{ color: themeColors.text }}>
                  Variants of {selectedModel?.name || "—"}
                </strong>

                {canEdit && selectedModel && (
                  <button
                    onClick={() =>
                      setForm({
                        method: "POST",
                        endpoint: "/variants",
                        data: {
                          model_id: selectedModel.id,
                          variant_name: "",
                          stock: 0,
                          purchase_price: 0,
                          selling_price: 0,
                          reorder_level: 0
                        }
                      })
                    }
                  >
                    + Add Variant
                  </button>
                )}
              </div>

              {variants.length === 0 ? (
                <Empty text="No variants available" theme={themeColors} />
              ) : (
                <table
                  width="100%"
                  style={{
                    borderCollapse: "collapse",
                    fontSize: "0.9rem"
                  }}
                >
                  <thead>
                    <tr>
                      <th key="variant" style={thStyle(themeColors)}>Variant</th>
                      <th key="stock" style={thStyle(themeColors)}>Stock</th>
                      <th key="price" style={thStyle(themeColors)}>Price</th>
                      {canEdit && <th key="action" style={thStyle(themeColors)}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map(v => (
                      <tr
                        key={v.id}
                        style={{
                          color:
                            Number(v.stock) <= Number(v.reorder_level)
                              ? "#ef4444"
                              : themeColors.text
                        }}
                      >
                        <td style={tdStyle(themeColors)}>{v.variant_name}</td>
                        <td style={tdStyle(themeColors)}>{formatNumber(v.stock)}</td>
                        <td style={tdStyle(themeColors)}>₹{formatNumber(v.selling_price)}</td>
                        {canEdit && (
                          <td style={tdStyle(themeColors)}>
                            <button
                              onClick={() =>
                                setForm({
                                  method: "PUT",
                                  id: v.id,
                                  endpoint: "/variants",
                                  data: {
                                    variant_name: v.variant_name,
                                    stock: v.stock,
                                    purchase_price: v.purchase_price,
                                    selling_price: v.selling_price,
                                    reorder_level: v.reorder_level
                                  }
                                })
                              }
                              style={{
                                padding: "4px 8px",
                                fontSize: "0.8rem",
                                cursor: "pointer"
                              }}
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Section>
          </div>

          {form && (
            <div style={{ marginTop: "1rem" }}>
              <h4 style={{ color: themeColors.text }}>{form.method === "PUT" ? "Edit" : "Add"}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                {Object.keys(form.data).map(k => (
                  <div key={k} style={{ display: "flex", flexDirection: "column" }}>
                    <label style={{ marginBottom: "0.5rem", fontWeight: 600, color: themeColors.text }}>
                      {k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, " ")}
                    </label>
                    <input
                      placeholder={k}
                      type={["stock", "purchase_price", "selling_price", "reorder_level"].includes(k) ? "number" : "text"}
                      value={form.data[k]}
                      onChange={e =>
                        setForm({
                          ...form,
                          data: { ...form.data, [k]: e.target.value }
                        })
                      }
                      style={{
                        padding: "0.5rem",
                        borderRadius: "6px",
                        border: `1px solid ${themeColors.border}`,
                        background: themeColors.surface,
                        color: themeColors.text
                      }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
                <button onClick={save} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: themeColors.accent, color: "white", border: "none", borderRadius: "6px" }}>Save</button>
                <button onClick={() => setForm(null)} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#6b7280", color: "white", border: "none", borderRadius: "6px" }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== UI HELPERS ===== */

function Section({ title, children, canAdd, onAdd, theme }) {
  return (
    <div
      style={{
        background: theme.surface,
        padding: title === "Variants" ? "1rem" : "0.75rem",
        borderRadius: "12px",
        border:
          title === "Variants"
            ? `1px solid ${theme.border}`
            : "1px solid rgba(148,163,184,0.25)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        opacity: title === "Variants" ? 1 : 0.92,
        height: "fit-content"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.5rem"
        }}
      >
        <span style={{ fontWeight: 600, color: theme.text }}>{title}</span>
        {canAdd && <button onClick={onAdd}>+ Add</button>}
      </div>
      {children}
    </div>
  );
}

function Item({ label, onClick, active, theme }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "6px 8px",
        cursor: "pointer",
        borderRadius: "6px",
        background: active ? "#1d4ed8" : "transparent",
        color: active ? "#ffffff" : theme.text,
        marginBottom: "4px"
      }}
    >
      {label}
    </div>
  );
}

function ItemWithActions({ label, onClick, active, theme, onEdit, onDelete, deleted, onRestore }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "4px",
        borderRadius: "6px",
        overflow: "hidden",
        background: active ? "#1d4ed8" : "transparent",
        opacity: deleted ? 0.6 : 1
      }}
    >
      <div
        onClick={onClick}
        style={{
          flex: 1,
          padding: "6px 8px",
          cursor: deleted ? "default" : "pointer",
          color: active ? "#ffffff" : theme.text,
          textDecoration: deleted ? "line-through" : "none"
        }}
      >
        {label}
      </div>
      {(onEdit || onDelete || onRestore) && (
        <div style={{ display: "flex", gap: "2px", paddingRight: "4px" }}>
          {onEdit && (
            <button
              key="edit"
              onClick={e => {
                e.stopPropagation();
                onEdit();
              }}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                background: active ? "#2563eb" : "#3b82f6",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px"
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              key="delete"
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                background: active ? "#dc2626" : "#ef4444",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px"
              }}
            >
              Delete
            </button>
          )}
          {onRestore && (
            <button
              key="restore"
              onClick={e => {
                e.stopPropagation();
                onRestore();
              }}
              style={{
                padding: "2px 6px",
                fontSize: "0.7rem",
                cursor: "pointer",
                background: "#22c55e",
                color: "#ffffff",
                border: "none",
                borderRadius: "3px"
              }}
            >
              Restore
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ text, theme }) {
  return (
    <p style={{ fontSize: "0.8rem", color: theme.textSecondary }}>
      {text}
    </p>
  );
}

const thStyle = theme => ({
  textAlign: "left",
  padding: "8px",
  color: theme.text,
  fontWeight: 600,
  borderBottom: `1px solid ${theme.border}`
});

const tdStyle = theme => ({
  padding: "8px",
  borderBottom: `1px solid ${theme.border}`
});
