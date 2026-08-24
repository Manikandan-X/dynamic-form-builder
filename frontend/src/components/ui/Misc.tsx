import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { tokens } from "../../theme";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        border: `1px dashed ${tokens.hairlineStrong}`,
        borderRadius: 2,
        backgroundColor: tokens.card,
        px: 6,
        py: 8,
        textAlign: "center",
      }}
    >
      <Stack spacing={1.5} alignItems="center">
        <Typography variant="h6" sx={{ color: tokens.ink }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: tokens.inkFaint, maxWidth: 380 }}>
            {description}
          </Typography>
        )}
        {action}
      </Stack>
    </Box>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <Box
      sx={{
        mb: 4,
        pb: 3,
        borderBottom: `1px solid ${tokens.hairline}`,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { sm: "flex-end" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{ color: tokens.ledger, display: "block", mb: 0.5, fontSize: "0.68rem" }}
          >
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h4" sx={{ color: tokens.ink }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" sx={{ color: tokens.inkSoft, mt: 0.75, maxWidth: 620 }}>
            {description}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Box>
  );
}
