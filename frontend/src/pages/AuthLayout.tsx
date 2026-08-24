import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { tokens } from "../theme";

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 1fr" }, minHeight: "100vh" }}>
      <Box
        sx={{
          position: "relative",
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          backgroundColor: tokens.ledger,
          color: tokens.paper,
          px: 7,
          py: 7,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 31px, ${tokens.paper} 31px, ${tokens.paper} 32px)`,
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative", display: "flex", alignItems: "center", gap: 1.25 }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="5" fill={tokens.paper} />
            <path d="M8 10h16M8 16h16M8 22h10" stroke={tokens.ledger} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <Typography variant="h6" sx={{ color: tokens.paper }}>
            Formcraft
          </Typography>
        </Box>

        <Box sx={{ position: "relative", maxWidth: 420 }}>
          <Typography
            variant="overline"
            className="stamp-mark"
            sx={{ display: "inline-block", mb: 3, color: "rgba(238,235,226,0.8)", border: "1.5px solid currentColor", px: 1.25, py: 0.25, borderRadius: "3px" }}
          >
            Form No. 001 — Access
          </Typography>
          <Typography variant="h3" sx={{ color: tokens.paper, lineHeight: 1.15, fontSize: "2.2rem" }}>
            Every response, filed and accounted for.
          </Typography>
          <Typography sx={{ mt: 2, color: "rgba(238,235,226,0.75)" }}>
            Build dynamic forms with conditional logic, collect structured responses, and review it all
            through dashboards and exportable reports.
          </Typography>
        </Box>

        <Typography variant="caption" sx={{ position: "relative", fontFamily: '"IBM Plex Mono", monospace', textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(238,235,226,0.5)" }}>
          Formcraft Ledger — internal tooling
        </Typography>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: 3, py: 8 }}>
        <Box sx={{ width: "100%", maxWidth: 380 }}>
          <Typography variant="overline" sx={{ color: tokens.ledger, display: "block", mb: 0.5, fontSize: "0.68rem" }}>
            {eyebrow}
          </Typography>
          <Typography variant="h4" sx={{ color: tokens.ink }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.75, color: tokens.inkSoft }}>
            {description}
          </Typography>
          <Box sx={{ mt: 4 }}>{children}</Box>
        </Box>
      </Box>
    </Box>
  );
}
