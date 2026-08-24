import { createTheme, alpha } from "@mui/material/styles";

// -------- Ledger design tokens --------
export const tokens = {
  paper: "#EEEBE2",
  paperDim: "#E4E0D3",
  card: "#F8F6EF",
  cardRaised: "#FFFFFF",
  ink: "#1C1E1A",
  inkSoft: "#4A4C43",
  inkFaint: "#8A8B7E",
  hairline: "#D2CDBC",
  hairlineStrong: "#B7B09A",
  ledger: "#28466B",
  ledgerSoft: "#E3E9F0",
  ledgerDeep: "#1B3350",
  moss: "#3F6B4A",
  mossSoft: "#E4ECE3",
  rust: "#9C3B2E",
  rustSoft: "#F3E2DE",
  ochre: "#B8862B",
  ochreSoft: "#F3E9D3",
};

export const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: tokens.paper,
      paper: tokens.card,
    },
    text: {
      primary: tokens.ink,
      secondary: tokens.inkSoft,
    },
    primary: {
      main: tokens.ledger,
      dark: tokens.ledgerDeep,
      light: tokens.ledgerSoft,
      contrastText: tokens.paper,
    },
    success: {
      main: tokens.moss,
      light: tokens.mossSoft,
    },
    error: {
      main: tokens.rust,
      light: tokens.rustSoft,
    },
    warning: {
      main: tokens.ochre,
      light: tokens.ochreSoft,
    },
    divider: tokens.hairline,
  },
  shape: {
    borderRadius: 6,
  },
  typography: {
    fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
    h1: { fontFamily: '"Source Serif 4", Georgia, serif' },
    h2: { fontFamily: '"Source Serif 4", Georgia, serif' },
    h3: { fontFamily: '"Source Serif 4", Georgia, serif' },
    h4: { fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 600 },
    h5: { fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 600 },
    h6: { fontFamily: '"Source Serif 4", Georgia, serif', fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
    overline: {
      fontFamily: '"IBM Plex Mono", monospace',
      letterSpacing: "0.12em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.paper,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.card,
          border: `1px solid ${tokens.hairline}`,
          boxShadow: "0 1px 0 rgba(28,30,26,0.02), 0 8px 20px -12px rgba(28,30,26,0.12)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: tokens.ledgerDeep,
          },
        },
        outlined: {
          borderColor: tokens.hairlineStrong,
          color: tokens.ink,
          "&:hover": {
            borderColor: tokens.hairlineStrong,
            backgroundColor: tokens.cardRaised,
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.cardRaised,
          "& fieldset": {
            borderColor: tokens.hairlineStrong,
          },
          "&:hover fieldset": {
            borderColor: tokens.ledger,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "0.68rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: "0.68rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: tokens.inkFaint,
          backgroundColor: tokens.paperDim,
          borderBottom: `1px solid ${tokens.hairline}`,
        },
        body: {
          borderBottom: `1px solid ${tokens.hairline}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: tokens.hairline },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: tokens.card,
          border: `1px solid ${tokens.hairline}`,
        },
      },
    },
  },
});

export function stampSx(color: string) {
  return {
    color,
    borderColor: alpha(color, 0.6),
  };
}
