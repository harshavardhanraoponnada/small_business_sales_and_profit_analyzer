import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type HTMLInputTypeAttribute,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Moon,
  Sun,
  ShieldCheck,
  ArrowLeft,
  CircleCheck,
  Sparkles,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "./authContext";
import api from "../services/api";

type AuthMode = "login" | "forgot" | "reset";

const getErrorMessage = (error: unknown, fallback: string) => {
  const candidate = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return candidate?.response?.data?.message || fallback;
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

interface InputWrapperProps {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: HTMLInputTypeAttribute;
  icon: LucideIcon;
  rightControl?: ReactNode;
  disabled: boolean;
}

const InputWrapper = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  rightControl,
  disabled,
}: InputWrapperProps) => (
  <motion.div variants={fadeUp} className="w-full relative group">
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      <Icon
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400 transition-colors pointer-events-none"
      />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-12 rounded-xl border border-slate-300 dark:border-white/10 bg-white/60 dark:bg-[#0b0f19]/55 backdrop-blur-md pl-11 pr-11 text-[0.95rem] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600/40 focus:border-cyan-500 dark:focus:border-cyan-500 transition-all duration-300 shadow-sm"
      />
      {rightControl ? <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightControl}</div> : null}
    </div>
  </motion.div>
);

export default function ModernLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem("phoneverse-theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    window.localStorage.setItem("phoneverse-theme", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!username || !password) {
        setError("Please enter both username and password");
        return;
      }

      await login(username, password);
      setTimeout(() => navigate("/"), 400);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid username or password"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!resetEmail) {
        setError("Please enter your email address");
        return;
      }

      await api.post("/auth/forgot-password", { email: resetEmail });
      setMode("reset");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Unable to send OTP. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!otp || !newPassword || !confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }

      await api.post("/auth/reset-password", { email: resetEmail, otp, newPassword });

      setMode("login");
      setError("");
      setResetEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid or expired OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  const modeMeta: Record<AuthMode, { title: string; subtitle: string; cta: string }> = {
    login: {
      title: "Welcome Back",
      subtitle: "Enter your credentials to access your workspace.",
      cta: "Sign In",
    },
    forgot: {
      title: "Reset Password",
      subtitle: "We'll send you a secure OTP to verify your identity.",
      cta: "Send OTP",
    },
    reset: {
      title: "Secure Account",
      subtitle: "Create an impenetrable new password.",
      cta: "Set Password",
    },
  };

  return (
    <div
      className={`min-h-screen w-full relative overflow-hidden transition-colors duration-500 ${isDark ? "dark bg-[#0b0f19]" : "bg-[#fcfcfc]"}`}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 40, -40, 0], y: [0, -40, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 dark:bg-cyan-900/20 blur-[120px]"
        />
        <motion.div
          animate={{ x: [0, -50, 50, 0], y: [0, 50, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[15%] w-[60%] h-[60%] rounded-full bg-blue-600/10 dark:bg-blue-900/15 blur-[150px]"
        />
        <div className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15] bg-[linear-gradient(to_right,#8080801a_1px,transparent_1px),linear-gradient(to_bottom,#8080801a_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 min-h-screen relative z-10">
        <section className="order-last lg:order-first relative p-8 lg:p-16 flex flex-col justify-center lg:justify-between border-t lg:border-t-0 lg:border-r border-slate-200 dark:border-white/5 gap-12 lg:gap-0 bg-white/40 dark:bg-transparent backdrop-blur-sm lg:backdrop-blur-none">
          <div className="flex items-center justify-between">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                <Sparkles size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">PhoneVerse</span>
            </motion.div>
          </div>

          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-xl">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md mb-6 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-cyan-600 animate-pulse" />
              <span className="text-[0.75rem] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">v2.0 Profit Engine</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-5xl lg:text-[4rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.05]">
              Turn Data Into <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Unfair Advantage</span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-sm">
              Join 1,000+ businesses using our AI-driven dashboards to maximize margins and eliminate leakage.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-12 grid grid-cols-2 gap-4">
              {[
                {
                  label: "Gross Margin",
                  val: "+14.2%",
                  bg: "from-emerald-500/10 to-emerald-500/5",
                  border: "border-emerald-500/20",
                },
                {
                  label: "Data Accuracy",
                  val: "99.9%",
                  bg: "from-cyan-500/10 to-blue-500/5",
                  border: "border-cyan-500/20",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`p-6 rounded-[2rem] border ${stat.border} bg-gradient-to-b ${stat.bg} backdrop-blur-sm relative overflow-hidden group`}
                >
                  <div className="absolute inset-0 bg-white/40 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1 relative z-10">{stat.label}</p>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tighter relative z-10">{stat.val}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400"
          >
            <ShieldCheck size={16} className="text-emerald-500" /> SOC2 Type II Certified
          </motion.div>
        </section>

        <section className="order-first lg:order-last flex flex-col items-center justify-center p-6 lg:p-12 relative w-full lg:h-full min-h-[100dvh] lg:min-h-0">
          <div className="absolute top-6 left-6 lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Sparkles size={16} />
            </div>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">PhoneVerse</span>
          </div>

          <div className="w-full max-w-[420px] flex justify-end mb-3 mt-10 lg:mt-0">
            <button
              onClick={() => setIsDark((value) => !value)}
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm hover:bg-white dark:hover:bg-slate-800/60 transition-colors"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-full max-w-[420px] bg-white/75 dark:bg-[#0b0f19]/72 backdrop-blur-2xl border border-slate-200 dark:border-white/10 p-8 sm:p-10 rounded-[2.25rem] shadow-2xl dark:shadow-[0_0_80px_rgba(14,165,233,0.08)] relative z-10"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2.25rem] opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-10 -z-10" />

            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">{modeMeta[mode].title}</h2>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 font-medium">{modeMeta[mode].subtitle}</p>
                </div>

                {error ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mb-6 rounded-2xl p-3 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm flex items-start gap-2.5"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">{error}</span>
                  </motion.div>
                ) : null}

                <motion.form
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                  onSubmit={mode === "login" ? handleLogin : mode === "forgot" ? handleForgotPassword : handleResetPassword}
                  className="space-y-4"
                >
                  {mode === "login" ? (
                    <>
                      <InputWrapper
                        label="Username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="e.g. john_doe"
                        icon={User}
                        disabled={isLoading}
                      />
                      <InputWrapper
                        label="Password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        icon={Lock}
                        type={showPassword ? "text" : "password"}
                        disabled={isLoading}
                        rightControl={
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }
                      />

                      <motion.div variants={fadeUp} className="flex justify-between items-center pt-1 pb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="remember"
                            className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-600 dark:bg-slate-800"
                          />
                          <label htmlFor="remember" className="text-xs font-bold text-slate-500 dark:text-slate-400 cursor-pointer">
                            Remember me
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </motion.div>
                    </>
                  ) : null}

                  {mode === "forgot" ? (
                    <InputWrapper
                      label="Work Email"
                      value={resetEmail}
                      onChange={(event) => setResetEmail(event.target.value)}
                      placeholder="name@company.com"
                      icon={Mail}
                      type="email"
                      disabled={isLoading}
                    />
                  ) : null}

                  {mode === "reset" ? (
                    <>
                      <InputWrapper
                        label="Verification Code"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        placeholder="6-digit code"
                        icon={CircleCheck}
                        disabled={isLoading}
                      />
                      <InputWrapper
                        label="New Password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        icon={Lock}
                        type={showNewPassword ? "text" : "password"}
                        disabled={isLoading}
                        rightControl={
                          <button
                            type="button"
                            onClick={() => setShowNewPassword((value) => !value)}
                            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }
                      />
                      <InputWrapper
                        label="Confirm Password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Confirm new password"
                        icon={Lock}
                        type={showConfirmPassword ? "text" : "password"}
                        disabled={isLoading}
                        rightControl={
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword((value) => !value)}
                            className="p-2 text-slate-400 hover:text-cyan-500 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        }
                      />
                    </>
                  ) : null}

                  <motion.div variants={fadeUp} className="pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-cyan-700/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          {modeMeta[mode].cta}
                          <ChevronRight size={16} className="opacity-70" />
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                </motion.form>

                {mode !== "login" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 text-center"
                  >
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <ArrowLeft size={14} /> Return to login
                    </button>
                  </motion.div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
