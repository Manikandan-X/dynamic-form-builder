import Chip, { type ChipProps } from "@mui/material/Chip";
import { tokens } from "../../theme";

type StampTone = "moss" | "ochre" | "rust" | "ledger" | "faint";

const TONE_COLOR: Record<StampTone, string> = {
  moss: tokens.moss,
  ochre: tokens.ochre,
  rust: tokens.rust,
  ledger: tokens.ledger,
  faint: tokens.inkFaint,
};

export function Stamp({ tone = "faint", label, ...rest }: { tone?: StampTone } & Omit<ChipProps, "color">) {
  const color = TONE_COLOR[tone];
  return (
    <Chip
      className="stamp-mark"
      label={label}
      size="small"
      variant="outlined"
      sx={{
        color,
        borderColor: color,
        borderWidth: 1.5,
        backgroundColor: "transparent",
        borderRadius: "3px",
      }}
      {...rest}
    />
  );
}
