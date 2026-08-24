import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import FormsListPage from "./pages/forms/FormsListPage";
import FormDetailPage from "./pages/forms/FormDetailPage";
import FormEditorPage from "./pages/forms/FormEditorPage";
import FillFormPage from "./pages/forms/FillFormPage";
import FormResponsesPage from "./pages/forms/FormResponsesPage";
import MyResponsesPage from "./pages/forms/MyResponsesPage";
import ResponseDetailPage from "./pages/forms/ResponseDetailPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminActivityLogsPage from "./pages/admin/AdminActivityLogsPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/forms"
        element={
          <ProtectedRoute>
            <FormsListPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/new"
        element={
          <ProtectedRoute adminOnly>
            <FormEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id"
        element={
          <ProtectedRoute>
            <FormDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/edit"
        element={
          <ProtectedRoute adminOnly>
            <FormEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/fill"
        element={
          <ProtectedRoute>
            <FillFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/forms/:id/responses"
        element={
          <ProtectedRoute adminOnly>
            <FormResponsesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/responses"
        element={
          <ProtectedRoute>
            <MyResponsesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/responses/:id"
        element={
          <ProtectedRoute>
            <ResponseDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute adminOnly>
            <AdminRolesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/activity-logs"
        element={
          <ProtectedRoute adminOnly>
            <AdminActivityLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute adminOnly>
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
