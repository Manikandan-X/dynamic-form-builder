import { type ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import { useAuth } from "../../context/AuthContext";
import { tokens } from "../../theme";

const DRAWER_WIDTH = 264;

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <SpaceDashboardOutlinedIcon fontSize="small" /> },
  { to: "/forms", label: "Forms", icon: <DescriptionOutlinedIcon fontSize="small" /> },
  { to: "/responses", label: "My Responses", icon: <FactCheckOutlinedIcon fontSize="small" /> },
  { to: "/admin/users", label: "Users", icon: <GroupOutlinedIcon fontSize="small" />, adminOnly: true },
  { to: "/admin/roles", label: "Roles", icon: <ShieldOutlinedIcon fontSize="small" />, adminOnly: true },
  { to: "/admin/activity-logs", label: "Activity Log", icon: <HistoryOutlinedIcon fontSize="small" />, adminOnly: true },
  { to: "/admin/reports", label: "Reports", icon: <BarChartOutlinedIcon fontSize="small" />, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ px: 3, py: 3, display: { xs: "none", lg: "block" } }}>
        <BrandMark />
      </Box>

      <List sx={{ px: 1.5, py: 1, flex: 1 }}>
        {items.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            sx={{
              borderRadius: 1.5,
              mb: 0.5,
              color: tokens.inkSoft,
              "&.active": {
                backgroundColor: tokens.ledgerSoft,
                color: tokens.ledgerDeep,
                fontWeight: 600,
              },
              "&.active .MuiListItemIcon-root": { color: tokens.ledger },
              "&:hover": { backgroundColor: tokens.paperDim },
            }}
          >
            <ListItemIcon sx={{ minWidth: 34, color: tokens.inkFaint }}>{item.icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: "0.875rem" }}>{item.label}</ListItemText>
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <Box sx={{ px: 2, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: tokens.paper, color: tokens.ink, border: `1px solid ${tokens.hairlineStrong}`, fontFamily: '"Source Serif 4", serif' }}>
            {user?.first_name?.[0]}
            {user?.last_name?.[0]}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: tokens.ink }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', textTransform: "uppercase", color: tokens.inkFaint }}>
              {user?.role}
            </Typography>
          </Box>
        </Box>
        <Button fullWidth variant="outlined" size="small" onClick={handleLogout} sx={{ justifyContent: "flex-start" }}>
          Sign out
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: "flex", lg: "none" },
          backgroundColor: tokens.card,
          borderBottom: `1px solid ${tokens.hairline}`,
          color: tokens.ink,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <BrandMark compact />
          <IconButton onClick={() => setMobileOpen(true)} edge="end">
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": { width: DRAWER_WIDTH, backgroundColor: tokens.card },
          }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", lg: "block" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              backgroundColor: tokens.card,
              borderRight: `1px solid ${tokens.hairline}`,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0 }}>
        <Toolbar sx={{ display: { xs: "flex", lg: "none" } }} />
        <Box sx={{ maxWidth: 1140, mx: "auto", px: { xs: 2, sm: 4 }, py: 4 }}>{children}</Box>
      </Box>
    </Box>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="5" fill={tokens.ledger} />
        <path d="M8 10h16M8 16h16M8 22h10" stroke={tokens.paper} strokeWidth="2" strokeLinecap="round" />
      </svg>
      {!compact && (
        <Box>
          <Typography variant="body1" sx={{ fontFamily: '"Source Serif 4", serif', lineHeight: 1, color: tokens.ink }}>
            Formcraft
          </Typography>
          <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', letterSpacing: "0.14em", textTransform: "uppercase", color: tokens.inkFaint, fontSize: "0.6rem" }}>
            Form Builder Ledger
          </Typography>
        </Box>
      )}
      {compact && (
        <Typography variant="body1" sx={{ fontFamily: '"Source Serif 4", serif', color: tokens.ink }}>
          Formcraft
        </Typography>
      )}
    </Box>
  );
}
