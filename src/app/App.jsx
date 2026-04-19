import { AuthProvider } from "../auth/authContext";
import { ThemeProvider } from "./ThemeContext";
import Router from "./router";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </ThemeProvider>
  );
}
