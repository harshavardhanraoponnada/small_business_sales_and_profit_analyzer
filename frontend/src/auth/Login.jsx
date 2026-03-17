import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./authContext";
import { Smartphone, Eye, EyeOff } from "lucide-react";
import api from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login"); // login | forgot | reset
  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  const sendOtp = async () => {
    try {
      await api.post("/auth/forgot-password", { email: resetEmail });
      setMode("reset");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to send OTP. Please try again.");
    }
  };

  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        email: resetEmail,
        otp,
        newPassword
      });
      setMode("login");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    }
  };

  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .login-container {
              grid-template-columns: 1fr !important;
              padding: 1rem !important;
              gap: 1rem !important;
            }
            .illustration-container {
              order: -1;
            }
            .form-container {
              max-width: 100% !important;
              padding: 1.5rem !important;
            }
            .welcome-heading {
              font-size: 2rem !important;
              text-align: center !important;
            }
            .welcome-subtitle {
              text-align: center !important;
            }
          }
        `}
      </style>
      <div
        className="login-container"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #ffffff 0%, #e6f3ff 50%, #cce7ff 100%)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          padding: "2rem",
          gap: "2rem"
        }}
      >
      {/* Left Column - Login Form */}
      <div
        style={{
          maxWidth: "400px",
          margin: "0 auto",
          padding: "2rem",
          background: "rgba(255, 255, 255, 0.9)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)"
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1a1a1a",
            marginBottom: "0.25rem",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <Smartphone size={24} />
          PhoneVerse
        </h2>
        <p
          style={{
            color: "#666",
            marginBottom: "1.5rem",
            fontSize: "0.9rem",
            textAlign: "left"
          }}
        >
          Small Business Sales & Profit Analyzer
        </p>


        <form onSubmit={submit}>
          {/* ================= LOGIN MODE ================= */}
          {mode === "login" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <input
                  type="text"
                  placeholder="Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "2px solid #e1e5e9",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "#fff"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                  onBlur={(e) => (e.target.style.borderColor = "#e1e5e9")}
                />
              </div>

              <div style={{ marginBottom: "1rem", position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    paddingRight: "3rem",
                    border: "2px solid #e1e5e9",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "#fff"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                  onBlur={(e) => (e.target.style.borderColor = "#e1e5e9")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div style={{ textAlign: "right", marginBottom: "1.5rem" }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("forgot");
                    setError("");
                  }}
                  style={{
                    color: "#4f46e5",
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
                }}
              >
                Sign In
              </button>
            </>
          )}

          {/* ================= FORGOT MODE ================= */}
          {mode === "forgot" && (
            <>
              <input
                type="email"
                placeholder="Enter registered email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid #e1e5e9",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  background: "#fff",
                  marginBottom: "1rem"
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                onBlur={(e) => (e.target.style.borderColor = "#e1e5e9")}
              />

              <button
                type="button"
                onClick={sendOtp}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
                }}
              >
                Send OTP
              </button>

              <p onClick={() => setMode("login")} style={{ cursor: "pointer" }}>
                ← Back to login
              </p>
            </>
          )}

          {/* ================= RESET MODE ================= */}
          {mode === "reset" && (
            <>
              <input
                placeholder="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "2px solid #e1e5e9",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "all 0.3s ease",
                  boxSizing: "border-box",
                  background: "#fff",
                  marginBottom: "1rem"
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                onBlur={(e) => (e.target.style.borderColor = "#e1e5e9")}
              />

              <div style={{ marginBottom: "1rem", position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    paddingRight: "3rem",
                    border: "2px solid #e1e5e9",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "#fff"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                  onBlur={(e) => (e.target.style.borderColor = "#e1e5e9")}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div style={{ marginBottom: "1rem", position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    paddingRight: "3rem",
                    border: "2px solid #e1e5e9",
                    borderRadius: "12px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box",
                    background: "#fff"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#4f46e5")}
                  onBlur={(e) => (e.target.style.borderColor = "#e1e5e9")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <button
                type="button"
                onClick={resetPassword}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background: "#4f46e5",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "1rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)"
                }}
              >
                Reset Password
              </button>
            </>
          )}

          {error && (
            <p style={{ color: "#ef4444", marginTop: "1rem", textAlign: "center" }}>
              {error}
            </p>
          )}
        </form>

      </div>

      {/* Right Column - Illustration */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem"
        }}
      >
        <svg
          width="500"
          height="400"
          viewBox="0 0 500 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            maxWidth: "100%",
            height: "auto"
          }}
        >
          {/* Smartphone */}
          <rect
            x="200"
            y="100"
            width="100"
            height="200"
            rx="20"
            fill="#4f46e5"
            stroke="#3730a3"
            strokeWidth="2"
          />
          <rect
            x="210"
            y="120"
            width="80"
            height="160"
            rx="8"
            fill="#ffffff"
          />
          <circle cx="250" cy="180" r="3" fill="#4f46e5" />
          <rect x="235" y="200" width="30" height="4" rx="2" fill="#4f46e5" />
          <rect x="245" y="210" width="10" height="2" rx="1" fill="#4f46e5" />

          {/* Earbuds */}
          <circle cx="150" cy="150" r="15" fill="#60a5fa" stroke="#3b82f6" strokeWidth="2" />
          <circle cx="350" cy="150" r="15" fill="#60a5fa" stroke="#3b82f6" strokeWidth="2" />
          <path d="M165 150 Q200 130 235 150" stroke="#60a5fa" strokeWidth="3" fill="none" />
          <path d="M335 150 Q300 130 265 150" stroke="#60a5fa" strokeWidth="3" fill="none" />

          {/* Smartwatch */}
          <rect
            x="180"
            y="320"
            width="60"
            height="60"
            rx="30"
            fill="#60a5fa"
            stroke="#3b82f6"
            strokeWidth="2"
          />
          <rect
            x="190"
            y="330"
            width="40"
            height="40"
            rx="20"
            fill="#ffffff"
          />
          <circle cx="210" cy="350" r="2" fill="#60a5fa" />

          {/* Connecting lines */}
          <path d="M250 300 Q250 310 210 330" stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="5,5" />
          <path d="M250 300 Q250 310 290 330" stroke="#60a5fa" strokeWidth="2" fill="none" strokeDasharray="5,5" />

          {/* Subtle shadows */}
          <ellipse cx="250" cy="310" rx="60" ry="10" fill="rgba(0,0,0,0.1)" />
        </svg>
      </div>
      </div>
    </>
  );
}
