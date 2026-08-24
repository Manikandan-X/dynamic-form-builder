import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import FormHelperText from "@mui/material/FormHelperText";
import Rating from "@mui/material/Rating";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import LinearProgress from "@mui/material/LinearProgress";
import Chip from "@mui/material/Chip";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import CloseIcon from "@mui/icons-material/Close";
import { api, ApiError, normalizeError, uploadFile, resolveFileUrl } from "../../lib/api";
import type { FormFieldResponse, FormResponseDto } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { tokens } from "../../theme";

export type Values = Record<number, unknown>;

export function isConditionMet(field: FormFieldResponse, values: Values, fieldsByKey: Map<string, FormFieldResponse>): boolean {
  if (!field.is_conditional || !field.conditional_field_key || !field.conditional_operator) return true;
  const dependsOn = fieldsByKey.get(field.conditional_field_key);
  if (!dependsOn) return true;
  const raw = values[dependsOn.id];
  const current = raw === undefined || raw === null ? "" : String(raw);
  const target = field.conditional_value ?? "";

  switch (field.conditional_operator) {
    case "EQUALS":
      return current === target;
    case "NOT_EQUALS":
      return current !== target;
    case "CONTAINS":
      return current.toLowerCase().includes(target.toLowerCase());
    case "GREATER_THAN":
      return Number(current) > Number(target);
    case "LESS_THAN":
      return Number(current) < Number(target);
    case "GREATER_THAN_OR_EQUAL":
      return Number(current) >= Number(target);
    case "LESS_THAN_OR_EQUAL":
      return Number(current) <= Number(target);
    default:
      return true;
  }
}

export default function FillFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const [form, setForm] = useState<FormResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [values, setValues] = useState<Values>({});
  const [submitAnonymously, setSubmitAnonymously] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<FormResponseDto>(`/forms/${id}`)
      .then((res) => setForm(res.data))
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  }, [id]);

  const fieldsByKey = useMemo(() => {
    const map = new Map<string, FormFieldResponse>();
    form?.fields.forEach((f) => map.set(f.client_key, f));
    return map;
  }, [form]);

  const visibleFields = useMemo(() => {
    if (!form) return [];
    return form.fields.slice().sort((a, b) => a.display_order - b.display_order).filter((f) => isConditionMet(f, values, fieldsByKey));
  }, [form, values, fieldsByKey]);

  const setValue = (fieldId: number, value: unknown) => setValues((v) => ({ ...v, [fieldId]: value }));

  const validate = (): boolean => {
    const errs: Record<number, string> = {};
    for (const field of visibleFields) {
      const raw = values[field.id];
      const isEmpty = raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0);

      if (field.is_required && isEmpty) {
        errs[field.id] = "This field is required.";
        continue;
      }
      if (isEmpty) continue;

      if (field.field_type === "TEXT" || field.field_type === "EMAIL") {
        const str = String(raw);
        if (field.min_length != null && str.length < field.min_length) errs[field.id] = `Must be at least ${field.min_length} characters.`;
        if (field.max_length != null && str.length > field.max_length) errs[field.id] = `Must be at most ${field.max_length} characters.`;
      }
      if (field.field_type === "NUMBER" || field.field_type === "RATING") {
        const num = Number(raw);
        if (field.min_value != null && num < field.min_value) errs[field.id] = `Must be at least ${field.min_value}.`;
        if (field.max_value != null && num > field.max_value) errs[field.id] = `Must be at most ${field.max_value}.`;
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = { values: visibleFields.map((f) => ({ field_id: f.id, value: values[f.id] ?? null })) };
      const endpoint = submitAnonymously ? `/responses/public/forms/${id}` : `/responses/forms/${id}`;
      await api.post(endpoint, payload);
      push("Response submitted.", "success");
      navigate(submitAnonymously ? `/forms/${id}` : "/responses");
    } catch (err) {
      setSubmitError((normalizeError(err) as ApiError).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="rounded" height={280} />
      </Stack>
    );
  }

  if (error || !form) {
    return <EmptyState title="Form not found" description={error ?? "This form doesn't exist or was removed."} />;
  }

  if (!form.is_active) {
    return <EmptyState title="This form is not accepting responses" description="It has been deactivated by an admin." />;
  }

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <PageHeader eyebrow={`Form No. ${String(form.id).padStart(3, "0")}`} title={form.title} description={form.description ?? undefined} />

      <Card sx={{ borderRadius: 2, p: { xs: 3, sm: 4 } }}>
        <Stack spacing={3}>
          {visibleFields.map((field) => (
            <FieldInput key={field.id} field={field} value={values[field.id]} onChange={(v) => setValue(field.id, v)} error={fieldErrors[field.id]} />
          ))}

          {user && form.is_public && (
            <FormControlLabel
              control={<Checkbox checked={submitAnonymously} onChange={(e) => setSubmitAnonymously(e.target.checked)} />}
              label={
                <Box>
                  <Typography variant="body2">Submit anonymously</Typography>
                  <Typography variant="caption" sx={{ color: tokens.inkFaint }}>
                    Your account won't be attached to this response.
                  </Typography>
                </Box>
              }
            />
          )}

          {submitError && <Alert severity="error">{submitError}</Alert>}

          <Box sx={{ pt: 2, borderTop: `1px solid ${tokens.hairline}`, display: "flex", justifyContent: "flex-end" }}>
            <Button variant="contained" size="large" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit response"}
            </Button>
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: FormFieldResponse;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  switch (field.field_type) {
    case "TEXT":
    case "EMAIL":
      return (
        <TextField
          label={field.label}
          required={field.is_required}
          type={field.field_type === "EMAIL" ? "email" : "text"}
          placeholder={field.placeholder ?? undefined}
          helperText={error ?? field.help_text ?? undefined}
          error={!!error}
          fullWidth
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "NUMBER":
      return (
        <TextField
          label={field.label}
          required={field.is_required}
          type="number"
          inputProps={{ min: field.min_value ?? undefined, max: field.max_value ?? undefined }}
          placeholder={field.placeholder ?? undefined}
          helperText={error ?? field.help_text ?? undefined}
          error={!!error}
          fullWidth
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "RATING": {
      const max = field.max_value ?? 5;
      return (
        <FormControl error={!!error}>
          <FormLabel sx={{ mb: 0.5, fontSize: "0.875rem" }}>
            {field.label} {field.is_required && <Box component="span" sx={{ color: tokens.rust }}>*</Box>}
          </FormLabel>
          <Rating
            value={value ? Number(value) : 0}
            max={max}
            onChange={(_, v) => onChange(v)}
            sx={{ color: tokens.ochre }}
          />
          <FormHelperText>{error ?? field.help_text ?? `Rate from ${field.min_value ?? 1} to ${max}`}</FormHelperText>
        </FormControl>
      );
    }
    case "DATE":
      return (
        <TextField
          label={field.label}
          required={field.is_required}
          type="date"
          helperText={error ?? field.help_text ?? undefined}
          error={!!error}
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "DROPDOWN":
      return (
        <TextField
          select
          label={field.label}
          required={field.is_required}
          helperText={error ?? field.help_text ?? undefined}
          error={!!error}
          fullWidth
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <MenuItem value="">Select…</MenuItem>
          {field.options.map((opt) => (
            <MenuItem key={opt.id} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      );
    case "RADIO":
      return (
        <FormControl error={!!error}>
          <FormLabel sx={{ mb: 0.5, fontSize: "0.875rem" }}>
            {field.label} {field.is_required && <Box component="span" sx={{ color: tokens.rust }}>*</Box>}
          </FormLabel>
          <RadioGroup value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((opt) => (
              <FormControlLabel key={opt.id} value={opt.value} control={<Radio size="small" />} label={opt.label} />
            ))}
          </RadioGroup>
          <FormHelperText>{error ?? field.help_text}</FormHelperText>
        </FormControl>
      );
    case "CHECKBOX": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return (
        <FormControl error={!!error}>
          <FormLabel sx={{ mb: 0.5, fontSize: "0.875rem" }}>
            {field.label} {field.is_required && <Box component="span" sx={{ color: tokens.rust }}>*</Box>}
          </FormLabel>
          <Stack>
            {field.options.map((opt) => (
              <FormControlLabel
                key={opt.id}
                control={
                  <Checkbox
                    size="small"
                    checked={selected.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) onChange([...selected, opt.value]);
                      else onChange(selected.filter((v) => v !== opt.value));
                    }}
                  />
                }
                label={opt.label}
              />
            ))}
          </Stack>
          <FormHelperText>{error ?? field.help_text}</FormHelperText>
        </FormControl>
      );
    }
    case "FILE":
      return <FileFieldInput field={field} value={value} onChange={onChange} error={error} />;
    default:
      return null;
  }
}

function FileFieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: FormFieldResponse;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  const { push } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileUrl = typeof value === "string" ? value : "";
  const fileName = fileUrl ? decodeURIComponent(fileUrl.split("/").pop() ?? "Uploaded file") : "";

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    try {
      const uploaded = await uploadFile(file, setProgress);
      onChange(uploaded.file_url);
      push(`"${uploaded.file_name}" uploaded.`, "success");
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <FormControl error={!!error} fullWidth>
      <FormLabel sx={{ mb: 0.75, fontSize: "0.875rem" }}>
        {field.label} {field.is_required && <Box component="span" sx={{ color: tokens.rust }}>*</Box>}
      </FormLabel>

      {fileUrl ? (
        <Chip
          icon={<InsertDriveFileOutlinedIcon />}
          label={fileName}
          onDelete={() => onChange(null)}
          deleteIcon={<CloseIcon />}
          component="a"
          href={resolveFileUrl(fileUrl)}
          target="_blank"
          clickable
          sx={{ alignSelf: "flex-start", textTransform: "none", bgcolor: tokens.ledgerSoft, color: tokens.ledgerDeep, maxWidth: "100%" }}
        />
      ) : (
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadOutlinedIcon />}
          disabled={isUploading}
          sx={{ alignSelf: "flex-start" }}
        >
          {isUploading ? "Uploading…" : "Choose file"}
          <input type="file" hidden onChange={handleSelect}  
          accept=".xlsx,.csv,.pdf,jpf,.jpeg,.png"
          />
        </Button>
      )}

      {isUploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, borderRadius: 1 }} />}

      <FormHelperText>{error ?? field.help_text ?? "Upload a file for this field."}</FormHelperText>
    </FormControl>
  );
}
