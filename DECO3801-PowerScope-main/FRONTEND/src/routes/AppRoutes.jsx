import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import HomePage from "../pages/HomePage";
import DashboardPage from "../pages/Dashboard";
import PublicDashboard from "../pages/Publicdashboard";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" />} />
      <Route path="/public_dashboard" element={<PublicDashboard />} />
    </Routes>
  );
}