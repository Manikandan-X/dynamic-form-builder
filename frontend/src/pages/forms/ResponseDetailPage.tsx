import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Chip from "@mui/material/Chip";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { api, ApiError, normalizeError, resolveFileUrl } from "../../lib/api";
import type { FormFieldResponse, FormResponseDto, FormResponseResponseDto } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { FieldInput, type Values } from "./FillFormPage";
import { tokens } from "../../theme";
import { format, parseISO } from "date-fns";

function deserializeValue(raw: string | null): unknown {
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return raw;
    }
  }
  return raw;
}

function displayValue(raw: string | null): string {
  const val = deserializeValue(raw);
  if (val === null || val === undefined || val === "") return "—";
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

export default function ResponseDetailPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { push } = useToast();

  const [response, setResponse] = useState<FormResponseResponseDto | null>(null);
  const [form, setForm] = useState<FormResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<Values>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<FormResponseResponseDto>(`/responses/${id}`)
      .then(async (res) => {
        setResponse(res.data);
        const seeded: Values = {};
        res.data.details.forEach((d) => {
          seeded[d.field_id] = deserializeValue(d.value);
        });
        setValues(seeded);
        const formRes = await api.get<FormResponseDto>(`/forms/${res.data.form_id}`);
        setForm(formRes.data);
      })
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  }, [id]);

  const canEdit = useMemo(() => {
    if (!response || !user) return false;
    return isAdmin || response.user_id === user.id;
  }, [response, user, isAdmin]);

  const handleSave = async () => {
    if (!form) return;
    setIsSaving(true);
    try {
      const payload = { values: form.fields.map((f) => ({ field_id: f.id, value: values[f.id] ?? null })) };
      const res = await api.put<FormResponseResponseDto>(`/responses/${id}`, payload);
      setResponse(res.data);
      setIsEditing(false);
      push("Response updated.", "success");
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/responses/${id}`);
      push("Response deleted.", "success");
      navigate("/responses");
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
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

  if (error || !response || !form) {
    return <EmptyState title="Response not found" description={error ?? "This response doesn't exist or you don't have access."} />;
  }

  return (
    <Box sx={{ maxWidth: 640, mx: "auto" }}>
      <PageHeader
        eyebrow={`Response #${response.id}`}
        title={form.title}
        description={`Submitted ${format(parseISO(response.submitted_at), "MMM d, yyyy · h:mm a")}`}
        actions={
          canEdit ? (
            <Stack direction="row" spacing={1}>
              {isEditing ? (
                <>
                  <Button variant="outlined" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSave} disabled={isSaving}>
                    Save changes
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outlined" color="error" onClick={() => setConfirmDelete(true)}>
                    Delete
                  </Button>
                  <Button variant="contained" onClick={() => setIsEditing(true)}>
                    Edit response
                  </Button>
                </>
              )}
            </Stack>
          ) : undefined
        }
      />

      <Card sx={{ borderRadius: 2, p: { xs: 3, sm: 4 } }}>
        {isEditing ? (
          <Stack spacing={3}>
            {form.fields
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((field) => (
                <FieldInput key={field.id} field={field} value={values[field.id]} onChange={(v) => setValues((prev) => ({ ...prev, [field.id]: v }))} />
              ))}
          </Stack>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: `1px solid ${tokens.hairline}` }} />}>
            {form.fields
              .slice()
              .sort((a, b) => a.display_order - b.display_order)
              .map((field) => {
                const detail = response.details.find((d) => d.field_id === field.id);
                return (
                  <Box key={field.id} sx={{ py: 1.75 }}>
                    <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', textTransform: "uppercase", color: tokens.inkFaint }}>
                      {field.label}
                    </Typography>
                    <ReadOnlyValue field={field} rawValue={detail?.value ?? null} />
                  </Box>
                );
              })}
          </Stack>
        )}
      </Card>

      <Typography variant="caption" sx={{ display: "block", mt: 2, color: tokens.inkFaint }}>
        <Link to="/responses" style={{ color: "inherit", textDecoration: "none" }}>
          ← Back to responses
        </Link>
      </Typography>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this response?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: tokens.inkSoft }}>
            This response will be permanently removed. This can't be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
            Delete response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function ReadOnlyValue({ field, rawValue }: { field: FormFieldResponse; rawValue: string | null }) {
  if (field.field_type === "FILE" && rawValue) {
    const fileName = decodeURIComponent(rawValue.split("/").pop() ?? "file");
    return (
      <Box sx={{ mt: 0.75 }}>
        <Chip
          icon={<InsertDriveFileOutlinedIcon />}
          label={fileName}
          component="a"
          href={resolveFileUrl(rawValue)}
          target="_blank"
          clickable
          sx={{ bgcolor: tokens.ledgerSoft, color: tokens.ledgerDeep, textTransform: "none" }}
        />
      </Box>
    );
  }

  return (
    <Typography variant="body2" className="field-underline" sx={{ mt: 0.5, display: "inline-block" }}>
      {displayValue(rawValue)}
    </Typography>
  );
}
