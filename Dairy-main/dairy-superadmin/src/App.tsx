import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import MainLayout from "./layout/mainLayout";
import Dashboard from "./pages/dashboard/dashboard";
import Centers from "./pages/centers/centers";
import AddCenter from "./pages/centers/addCenter";
import CenterDetails from "./pages/centers/centerDetails";
import RateChart from "./pages/rate-chart/rate-chart";
import AuditLog from "./pages/audit/audit";
import Quality from "./pages/quality/quality";
import Reports from "./pages/reports/reports";
import Settings from "./pages/settings/settings";
import Login from "./pages/login/login";
import NotFound from "./pages/NotFound";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem("superadmin-auth") === "true";
  const location = useLocation();

  if (!isAuth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/centers" element={<Centers />} />
        <Route path="/centers/add" element={<AddCenter />} />
        <Route path="/centers/:id" element={<CenterDetails />} />
        <Route path="/rate-chart" element={<RateChart />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/quality" element={<Quality />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
