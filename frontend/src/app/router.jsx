import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../auth/Login";
import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import ProtectedRoute from "./ProtectedRoute";
import Sales from "../pages/Sales";
import Expenses from "../pages/Expenses";
import Audit from "../pages/Audit";
import Inventory from "../pages/Inventory";
import Users from "../pages/Users";
import MLAnalytics from "../pages/MLAnalytics";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/products" element={
          <ProtectedRoute roles={["OWNER", "ACCOUNTANT"]}>
            <Products />
          </ProtectedRoute>
        } />

        <Route path="/sales" element={
          <ProtectedRoute>
            <Sales />
          </ProtectedRoute>
        } 
      />

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
          <ProtectedRoute roles={["OWNER", "ACCOUNTANT"]}>
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

      </Routes>
    </BrowserRouter>
  );
}
