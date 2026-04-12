import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ModernLogin from "../auth/ModernLogin";
import ProtectedRoute from "./ProtectedRoute";
import { LoadingState } from "../components/ui";

const AppLayout = lazy(() => import("../components/layout/AppLayout"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Products = lazy(() => import("../pages/Products"));
const Sales = lazy(() => import("../pages/Sales"));
const Expenses = lazy(() => import("../pages/Expenses"));
const Audit = lazy(() => import("../pages/Audit"));
const Inventory = lazy(() => import("../pages/Inventory"));
const Users = lazy(() => import("../pages/Users.tsx"));
const MLAnalytics = lazy(() => import("../pages/MLAnalytics"));

const routerFallback = (
  <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <LoadingState type="spinner" />
  </div>
);

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense fallback={routerFallback}>
        <Routes>
          <Route path="/login" element={<ModernLogin />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            
            <Route path="/products" element={
              <ProtectedRoute roles={["OWNER", "ACCOUNTANT"]}>
                <Products />
              </ProtectedRoute>
            } />

            <Route path="/sales" element={<Sales />} />

            <Route
              path="/inventory"
              element={
                <ProtectedRoute roles={["OWNER", "ACCOUNTANT"]}>
                  <Inventory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/expenses"
              element={
                <ProtectedRoute roles={["OWNER", "ACCOUNTANT"]}>
                  <Expenses />
                </ProtectedRoute>
              }
            />

            <Route
              path="/audit"
              element={
                <ProtectedRoute roles={["OWNER"]}>
                  <Audit />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute roles={["OWNER"]}>
                  <Users />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ml-analytics"
              element={
                <ProtectedRoute roles={["OWNER"]}>
                  <MLAnalytics />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
