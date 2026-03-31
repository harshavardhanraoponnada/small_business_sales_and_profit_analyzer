import { useEffect, useState } from "react";
import { useTheme } from "../app/ThemeContext";
import api from "../services/api";
import Header from "../components/layout/Header";

import { Users as UsersIcon } from "lucide-react";

export default function Users() {
  const { isDarkMode } = useTheme();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for adding user
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "STAFF"
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState(null);

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    username: "",
    email: "",
    role: "STAFF"
  });
  const [editLoading, setEditLoading] = useState(false);

  // Report preferences modal state
  const [preferencesUserId, setPreferencesUserId] = useState(null);
  const [preferences, setPreferences] = useState({
    reportFrequency: "none",
    reportFormat: "pdf",
    receiveScheduledReports: false,
  });
  const [preferencesLoading, setPreferencesLoading] = useState(false);

  // Theme colors
  const themeColors = {
    background: isDarkMode ? "#0f172a" : "#f8fafc",
    surface: isDarkMode ? "#1e293b" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    primary: "#3b82f6",
    danger: "#ef4444",
    success: "#10b981",
    isDarkMode,
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch users");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);

    try {
      await api.post("/auth/add-user", newUser);
      setNewUser({ username: "", email: "", password: "", role: "STAFF" });
      setShowAddForm(false);
      fetchUsers(); // Refresh the list
    } catch (err) {
      setAddError(err.response?.data?.message || "Failed to add user");
    } finally {
      setAddLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await api.delete(`/auth/delete-user/${userId}`);
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user");
    }
  };

  // Start editing a user
  const startEdit = (user) => {
    setEditingId(user.id);
    setEditData({
      username: user.username,
      email: user.email,
      role: user.role
    });
    setShowAddForm(false); // Hide add form if open
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({ username: "", email: "", role: "STAFF" });
  };

  // Save inline edit
  const saveEdit = async (userId) => {
    setEditLoading(true);
    try {
      await api.put(`/auth/update-user/${userId}`, editData);
      setEditingId(null);
      setEditData({ username: "", email: "", role: "STAFF" });
      fetchUsers(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  // Open preferences modal
  const openPreferencesModal = async (userId) => {
    setPreferencesUserId(userId);
    setPreferencesLoading(true);
    try {
      const response = await api.get(`/users/${userId}/preferences/reports`);
      setPreferences(response.data);
    } catch (err) {
      console.error("Failed to load preferences:", err);
      // Use defaults if load fails
      setPreferences({
        reportFrequency: "none",
        reportFormat: "pdf",
        receiveScheduledReports: false,
      });
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!preferencesUserId) return;
    
    setPreferencesLoading(true);
    try {
      await api.put(`/users/${preferencesUserId}/preferences/reports`, {
        reportFrequency: preferences.reportFrequency,
        reportFormat: preferences.reportFormat,
        receiveScheduledReports: preferences.receiveScheduledReports,
      });
      setPreferencesUserId(null);
      // Refresh users list
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save preferences");
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Close preferences modal
  const closePreferencesModal = () => {
    setPreferencesUserId(null);
    setPreferences({
      reportFrequency: "none",
      reportFormat: "pdf",
      receiveScheduledReports: false,
    });
  };

  return (
    <>
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>

          {/* Header with Add Button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UsersIcon size={24} />
              Users
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: themeColors.primary,
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "500",
              }}
            >
              {showAddForm ? "Cancel" : "Add User"}
            </button>
          </div>

          {/* Add User Form */}
          {showAddForm && (
            <div
              style={{
                backgroundColor: themeColors.surface,
                padding: "1.5rem",
                borderRadius: "8px",
                border: `1px solid ${themeColors.border}`,
                marginBottom: "2rem",
              }}
            >
              <h3 style={{ marginTop: 0 }}>Add New User</h3>
              <form onSubmit={handleAddUser}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: "4px",
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: "4px",
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Password
                    </label>
                    <input
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: "4px",
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500" }}>
                      Role
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        border: `1px solid ${themeColors.border}`,
                        borderRadius: "4px",
                        backgroundColor: themeColors.background,
                        color: themeColors.text,
                      }}
                    >
                      <option value="STAFF">Staff</option>
                      <option value="ACCOUNTANT">Accountant</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </div>
                </div>
                {addError && (
                  <p style={{ color: themeColors.danger, marginBottom: "1rem" }}>
                    {addError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    backgroundColor: themeColors.success,
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: addLoading ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "500",
                  }}
                >
                  {addLoading ? "Adding..." : "Add User"}
                </button>
              </form>
            </div>
          )}



          {/* Users Table */}
          {loading ? (
            <p>Loading users...</p>
          ) : error ? (
            <p style={{ color: themeColors.danger }}>{error}</p>
          ) : (
            <div
              style={{
                backgroundColor: themeColors.surface,
                borderRadius: "8px",
                border: `1px solid ${themeColors.border}`,
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: themeColors.background }}>
                    <th style={{ padding: "1rem", textAlign: "left", borderBottom: `1px solid ${themeColors.border}` }}>
                      ID
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", borderBottom: `1px solid ${themeColors.border}` }}>
                      Username
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", borderBottom: `1px solid ${themeColors.border}` }}>
                      Email
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", borderBottom: `1px solid ${themeColors.border}` }}>
                      Role
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", borderBottom: `1px solid ${themeColors.border}` }}>
                      Report Preferences
                    </th>
                    <th style={{ padding: "1rem", textAlign: "left", borderBottom: `1px solid ${themeColors.border}` }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: "1rem" }}>{user.id}</td>
                      <td style={{ padding: "1rem" }}>
                        {editingId === user.id ? (
                          <input
                            type="text"
                            value={editData.username}
                            onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: `1px solid ${themeColors.border}`,
                              borderRadius: "4px",
                              backgroundColor: themeColors.background,
                              color: themeColors.text,
                            }}
                          />
                        ) : (
                          user.username
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {editingId === user.id ? (
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: `1px solid ${themeColors.border}`,
                              borderRadius: "4px",
                              backgroundColor: themeColors.background,
                              color: themeColors.text,
                            }}
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {editingId === user.id ? (
                          <select
                            value={editData.role}
                            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                            style={{
                              width: "100%",
                              padding: "0.5rem",
                              border: `1px solid ${themeColors.border}`,
                              borderRadius: "4px",
                              backgroundColor: themeColors.background,
                              color: themeColors.text,
                            }}
                          >
                            <option value="STAFF">Staff</option>
                            <option value="ACCOUNTANT">Accountant</option>
                            <option value="OWNER">Owner</option>
                          </select>
                        ) : (
                          <span
                            style={{
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              fontWeight: "500",
                              backgroundColor:
                                user.role === "OWNER"
                                  ? "#fef3c7"
                                  : user.role === "ACCOUNTANT"
                                  ? "#dbeafe"
                                  : "#f3f4f6",
                              color:
                                user.role === "OWNER"
                                  ? "#92400e"
                                  : user.role === "ACCOUNTANT"
                                  ? "#1e40af"
                                  : "#374151",
                            }}
                          >
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ fontSize: "0.85rem", color: themeColors.textSecondary }}>
                          Freq: <strong>{user.reportFrequency || "none"}</strong> | Format: <strong>{user.reportFormat || "pdf"}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "1rem", display: "flex", gap: "0.5rem" }}>
                        {editingId === user.id ? (
                          <>
                            <button
                              onClick={() => saveEdit(user.id)}
                              disabled={editLoading}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: themeColors.success,
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: editLoading ? "not-allowed" : "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              {editLoading ? "Saving..." : "Save"}
                            </button>
                            <button
                              onClick={cancelEdit}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: themeColors.textSecondary,
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(user)}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: themeColors.primary,
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => openPreferencesModal(user.id)}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#f59e0b",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              Preferences
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: themeColors.danger,
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Preferences Modal */}
        {preferencesUserId && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={closePreferencesModal}
          >
            <div
              style={{
                backgroundColor: themeColors.surface,
                borderRadius: "12px",
                padding: "2rem",
                maxWidth: "400px",
                width: "90%",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
                color: themeColors.text,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", fontWeight: "600" }}>
                Report Preferences
              </h2>
              
              <p
                style={{
                  fontSize: "0.9rem",
                  color: themeColors.textSecondary,
                  marginBottom: "1.5rem",
                  padding: "0.75rem",
                  backgroundColor: themeColors.isDarkMode ? "#1e3a5f" : "#eff6ff",
                  borderLeft: `3px solid #3b82f6`,
                  borderRadius: "4px",
                }}
              >
                Editing preferences for: <strong>{users.find(u => u.id === preferencesUserId)?.username || "User"}</strong>
              </p>

              {preferencesLoading ? (
                <p>Loading preferences...</p>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    savePreferences();
                  }}
                >
                  {/* Report Frequency */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.95rem",
                      }}
                    >
                      Report Frequency
                    </label>
                    <select
                      name="reportFrequency"
                      value={preferences.reportFrequency}
                      onChange={(e) =>
                        setPreferences({ ...preferences, reportFrequency: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: themeColors.isDarkMode ? "#334155" : "#f8fafc",
                        color: themeColors.text,
                        fontSize: "0.95rem",
                        cursor: "pointer",
                      }}
                    >
                      <option value="none">None (Disabled)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Report Format */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: "600",
                        marginBottom: "0.5rem",
                        fontSize: "0.95rem",
                      }}
                    >
                      Report Format
                    </label>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                        }}
                      >
                        <input
                          type="radio"
                          name="reportFormat"
                          value="pdf"
                          checked={preferences.reportFormat === "pdf"}
                          onChange={(e) =>
                            setPreferences({ ...preferences, reportFormat: e.target.value })
                          }
                          style={{ cursor: "pointer" }}
                        />
                        PDF
                      </label>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          cursor: "pointer",
                          fontSize: "0.95rem",
                        }}
                      >
                        <input
                          type="radio"
                          name="reportFormat"
                          value="xlsx"
                          checked={preferences.reportFormat === "xlsx"}
                          onChange={(e) =>
                            setPreferences({ ...preferences, reportFormat: e.target.value })
                          }
                          style={{ cursor: "pointer" }}
                        />
                        Excel
                      </label>
                    </div>
                  </div>

                  {/* Receive Reports */}
                  <div style={{ marginBottom: "2rem" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        fontWeight: "600",
                        fontSize: "0.95rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        name="receiveScheduledReports"
                        checked={preferences.receiveScheduledReports}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            receiveScheduledReports: e.target.checked,
                          })
                        }
                        style={{
                          width: "1.25rem",
                          height: "1.25rem",
                          cursor: "pointer",
                        }}
                      />
                      Receive Scheduled Reports
                    </label>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button
                      type="button"
                      onClick={closePreferencesModal}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: `1px solid ${themeColors.border}`,
                        backgroundColor: "transparent",
                        color: themeColors.text,
                        fontWeight: "500",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={preferencesLoading}
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        borderRadius: "6px",
                        border: "none",
                        backgroundColor: preferencesLoading ? "#9ca3af" : "#3b82f6",
                        color: "#ffffff",
                        fontWeight: "500",
                        cursor: preferencesLoading ? "not-allowed" : "pointer",
                        fontSize: "0.95rem",
                      }}
                    >
                      {preferencesLoading ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
    </>
  );
}
