import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { useAuth } from "../context/AuthContext";
import { AppShell } from "../components/layout/AppShell";
import { tokens } from "../theme";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: tokens.paper }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: tokens.inkSoft }}>
          <CircularProgress size={20} sx={{ color: tokens.ledger }} />
          <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
            Loading…
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AppShell>{children}</AppShell>;
}
