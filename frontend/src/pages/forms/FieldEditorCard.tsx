import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid2";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { CONDITIONAL_OPERATOR_OPTIONS, FIELD_TYPE_OPTIONS, fieldTypeHasOptions } from "../../lib/constants";
import type { ConditionalOperator, FieldOptionCreate, FormFieldType } from "../../lib/types";
import { tokens } from "../../theme";

export interface FieldDraft {
  localId: string;
  id?: number; // present once persisted to backend (edit mode)
  client_key: string;
  label: string;
  field_type: FormFieldType;
  placeholder: string;
  help_text: string;
  is_required: boolean;
  display_order: number;
  min_length: string;
  max_length: string;
  min_value: string;
  max_value: string;
  is_conditional: boolean;
  conditional_field_key: string;
  conditional_operator: ConditionalOperator | "";
  conditional_value: string;
  options: FieldOptionCreate[];
}

export function makeEmptyField(displayOrder: number): FieldDraft {
  return {
    localId: crypto.randomUUID(),
    client_key: "",
    label: "",
    field_type: "TEXT",
    placeholder: "",
    help_text: "",
    is_required: false,
    display_order: displayOrder,
    min_length: "",
    max_length: "",
    min_value: "",
    max_value: "",
    is_conditional: false,
    conditional_field_key: "",
    conditional_operator: "",
    conditional_value: "",
    options: [],
  };
}

const LENGTH_TYPES: FormFieldType[] = ["TEXT", "EMAIL"];
const NUMERIC_TYPES: FormFieldType[] = ["NUMBER", "RATING"];

export function FieldEditorCard({
  field,
  index,
  siblingKeys,
  onChange,
  onRemove,
  onSave,
  isPersisted,
  isSaving,
  isNewInEditMode,
  collapsed,
  onToggleCollapsed,
  dragHandleProps,
}: {
  field: FieldDraft;
  index: number;
  siblingKeys: string[];
  onChange: (next: FieldDraft) => void;
  onRemove: () => void;
  onSave?: () => void;
  isPersisted?: boolean;
  isSaving?: boolean;
  isNewInEditMode?: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  dragHandleProps?: { attributes: Record<string, unknown>; listeners: Record<string, unknown> };
}) {
  const hasOptions = fieldTypeHasOptions(field.field_type);
  const showLength = LENGTH_TYPES.includes(field.field_type);
  const showNumeric = NUMERIC_TYPES.includes(field.field_type);

  const set = <K extends keyof FieldDraft>(key: K, value: FieldDraft[K]) => onChange({ ...field, [key]: value });

  const addOption = () => {
    const nextOrder = field.options.length + 1;
    set("options", [...field.options, { label: "", value: "", display_order: nextOrder }]);
  };

  const updateOption = (i: number, patch: Partial<FieldOptionCreate>) => {
    set("options", field.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  };

  const removeOption = (i: number) => {
    set(
      "options",
      field.options.filter((_, idx) => idx !== i).map((o, idx) => ({ ...o, display_order: idx + 1 })),
    );
  };

  return (
    <Card sx={{ borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, py: 1.5 }}>
        {dragHandleProps && (
          <IconButton size="small" {...dragHandleProps.attributes} {...dragHandleProps.listeners} sx={{ cursor: "grab", color: tokens.inkFaint }}>
            <DragIndicatorIcon fontSize="small" />
          </IconButton>
        )}
        <Box onClick={onToggleCollapsed} sx={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer" }}>
          <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
            {String(index + 1).padStart(2, "0")}
          </Typography>
          <Typography variant="body2" fontWeight={600} noWrap>
            {field.label || "Untitled field"}
          </Typography>
          <Chip label={field.field_type} size="small" sx={{ bgcolor: tokens.ledgerSoft, color: tokens.ledgerDeep, textTransform: "none" }} />
          {isNewInEditMode && <Chip label="unsaved" size="small" sx={{ bgcolor: tokens.ochreSoft, color: tokens.ochre, textTransform: "none" }} />}
        </Box>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0 }}>
          {onSave && (
            <Button size="small" variant="outlined" onClick={onSave} disabled={isSaving} type="button">
              {isNewInEditMode ? "Add field" : "Save field"}
            </Button>
          )}
          <IconButton size="small" onClick={onRemove} sx={{ color: tokens.rust }}>
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onToggleCollapsed} sx={{ color: tokens.inkFaint, transform: collapsed ? "none" : "rotate(180deg)", transition: "transform 0.15s" }}>
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={!collapsed}>
        <Box sx={{ borderTop: `1px solid ${tokens.hairline}`, px: 2.5, py: 2.5 }}>
          <Stack spacing={2.5}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Label" required fullWidth value={field.label} onChange={(e) => set("label", e.target.value)} placeholder="e.g. Full name" />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Field key"
                  required
                  fullWidth
                  disabled={isPersisted}
                  value={field.client_key}
                  onChange={(e) => set("client_key", e.target.value)}
                  placeholder="e.g. full_name"
                  helperText={isPersisted ? "Locked once saved." : "Letters, numbers, underscore. Must start with a letter."}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  select
                  label="Field type"
                  fullWidth
                  disabled={isPersisted}
                  value={field.field_type}
                  onChange={(e) => set("field_type", e.target.value as FormFieldType)}
                >
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <TextField
                  type="number"
                  label="Display order"
                  fullWidth
                  value={field.display_order}
                  onChange={(e) => set("display_order", Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <FormControlLabel
                  control={<Checkbox checked={field.is_required} onChange={(e) => set("is_required", e.target.checked)} />}
                  label="Required"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Placeholder" fullWidth value={field.placeholder} onChange={(e) => set("placeholder", e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Help text" fullWidth value={field.help_text} onChange={(e) => set("help_text", e.target.value)} />
              </Grid>
            </Grid>

            {showLength && (
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField type="number" label="Min length" fullWidth value={field.min_length} onChange={(e) => set("min_length", e.target.value)} />
                </Grid>
                <Grid size={6}>
                  <TextField type="number" label="Max length" fullWidth value={field.max_length} onChange={(e) => set("max_length", e.target.value)} />
                </Grid>
              </Grid>
            )}

            {showNumeric && (
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField type="number" label="Min value" fullWidth value={field.min_value} onChange={(e) => set("min_value", e.target.value)} />
                </Grid>
                <Grid size={6}>
                  <TextField type="number" label="Max value" fullWidth value={field.max_value} onChange={(e) => set("max_value", e.target.value)} />
                </Grid>
              </Grid>
            )}

            {hasOptions && (
              <Box>
                {isPersisted ? (
                  <Box sx={{ border: `1px dashed ${tokens.hairlineStrong}`, bgcolor: tokens.paper, borderRadius: 1, px: 2, py: 1.5 }}>
                    <Typography variant="overline" sx={{ color: tokens.inkSoft, fontSize: "0.68rem" }}>
                      Options (locked)
                    </Typography>
                    <Typography variant="caption" sx={{ display: "block", color: tokens.inkFaint, mb: 1 }}>
                      Options can only be set when a field is created. To change them, remove this field and add a new one.
                    </Typography>
                    <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ rowGap: 0.75 }}>
                      {field.options.map((opt, i) => (
                        <Chip key={i} label={opt.label} size="small" sx={{ bgcolor: tokens.cardRaised, border: `1px solid ${tokens.hairline}`, textTransform: "none" }} />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Stack spacing={1}>
                    <Typography variant="overline" sx={{ color: tokens.inkSoft, fontSize: "0.68rem" }}>
                      Options
                    </Typography>
                    {field.options.map((opt, i) => (
                      <Stack direction="row" spacing={1} alignItems="center" key={i}>
                        <TextField
                          size="small"
                          fullWidth
                          value={opt.label}
                          onChange={(e) => updateOption(i, { label: e.target.value, value: e.target.value })}
                          placeholder={`Option ${i + 1} label`}
                        />
                        <IconButton size="small" onClick={() => removeOption(i)} sx={{ color: tokens.inkFaint, "&:hover": { color: tokens.rust } }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ))}
                    <Button size="small" startIcon={<AddIcon />} onClick={addOption} sx={{ alignSelf: "flex-start", color: tokens.ledger }} type="button">
                      Add option
                    </Button>
                  </Stack>
                )}
              </Box>
            )}

            <Box sx={{ border: `1px solid ${tokens.hairline}`, bgcolor: tokens.paper, borderRadius: 1, px: 2, py: 1.5 }}>
              <FormControlLabel
                control={<Checkbox checked={field.is_conditional} onChange={(e) => set("is_conditional", e.target.checked)} />}
                label={
                  <Box>
                    <Typography variant="body2">Show conditionally</Typography>
                    <Typography variant="caption" sx={{ color: tokens.inkFaint }}>
                      Only display this field when another field's value matches a condition.
                    </Typography>
                  </Box>
                }
              />
              {field.is_conditional && (
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      label="When field"
                      fullWidth
                      value={field.conditional_field_key}
                      onChange={(e) => set("conditional_field_key", e.target.value)}
                    >
                      <MenuItem value="">Select a field…</MenuItem>
                      {siblingKeys.map((key) => (
                        <MenuItem key={key} value={key}>
                          {key}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      label="Operator"
                      fullWidth
                      value={field.conditional_operator}
                      onChange={(e) => set("conditional_operator", e.target.value as ConditionalOperator)}
                    >
                      <MenuItem value="">Select…</MenuItem>
                      {CONDITIONAL_OPERATOR_OPTIONS.map((op) => (
                        <MenuItem key={op.value} value={op.value}>
                          {op.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Value"
                      fullWidth
                      value={field.conditional_value}
                      onChange={(e) => set("conditional_value", e.target.value)}
                      placeholder="e.g. yes"
                    />
                  </Grid>
                </Grid>
              )}
            </Box>
          </Stack>
        </Box>
      </Collapse>
    </Card>
  );
}
