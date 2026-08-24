import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { FormResponseDto } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { Stamp } from "../../components/ui/Stamp";
import { useAuth } from "../../context/AuthContext";
import { FIELD_TYPE_LABEL } from "../../lib/constants";
import { tokens } from "../../theme";
import { format, parseISO } from "date-fns";

export default function FormDetailPage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api
      .get<FormResponseDto>(`/forms/${id}`)
      .then((res) => setForm(res.data))
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="rounded" height={220} />
      </Stack>
    );
  }

  if (error || !form) {
    return <EmptyState title="Form not found" description={error ?? "This form doesn't exist or was removed."} />;
  }

  return (
    <Box>
      <PageHeader
        eyebrow={`Form No. ${String(form.id).padStart(3, "0")}`}
        title={form.title}
        description={form.description ?? undefined}
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate(`/forms/${form.id}/fill`)}>
              Fill this form
            </Button>
            {isAdmin && (
              <>
                <Button variant="outlined" onClick={() => navigate(`/forms/${form.id}/responses`)}>
                  Responses
                </Button>
                <Button variant="contained" onClick={() => navigate(`/forms/${form.id}/edit`)}>
                  Edit
                </Button>
              </>
            )}
          </Stack>
        }
      />

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mb: 3, rowGap: 1 }}>
        <Stamp tone={form.is_active ? "moss" : "faint"} label={form.is_active ? "Active" : "Inactive"} />
        <Stamp tone={form.is_public ? "ledger" : "faint"} label={form.is_public ? "Public" : "Internal"} />
        <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
          Created {format(parseISO(form.created_at), "MMM d, yyyy")}
        </Typography>
      </Stack>

      <Card sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: `1px solid ${tokens.hairline}`, px: 3, py: 2 }}>
          <Typography variant="h6">Fields ({form.fields.length})</Typography>
        </Box>
        {form.fields.length === 0 ? (
          <Typography variant="body2" sx={{ color: tokens.inkFaint, textAlign: "center", py: 5 }}>
            No fields have been added to this form yet.
          </Typography>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: `1px solid ${tokens.hairline}` }} />}>
            {form.fields.map((field) => (
              <Box key={field.id} sx={{ px: 3, py: 1.75 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
                      {String(field.display_order).padStart(2, "0")}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {field.label}
                    </Typography>
                    {field.is_required && <Typography sx={{ color: tokens.rust }}>*</Typography>}
                  </Box>
                  <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.ledger, textTransform: "uppercase" }}>
                    {FIELD_TYPE_LABEL[field.field_type]}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: 3.5, mt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
                    {field.client_key}
                  </Typography>
                  {field.is_conditional && (
                    <Typography
                      variant="caption"
                      sx={{ bgcolor: tokens.ochreSoft, color: tokens.ochre, px: 1, py: 0.25, borderRadius: 0.5 }}
                    >
                      shown if {field.conditional_field_key}{" "}
                      {field.conditional_operator?.toLowerCase().replaceAll("_", " ")} "{field.conditional_value}"
                    </Typography>
                  )}
                </Box>
                {field.options.length > 0 && (
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ pl: 3.5, mt: 1, rowGap: 0.75 }}>
                    {field.options.map((opt) => (
                      <Box
                        key={opt.id}
                        sx={{ border: `1px solid ${tokens.hairline}`, bgcolor: tokens.paper, px: 1, py: 0.25, borderRadius: 0.5 }}
                      >
                        <Typography variant="caption" sx={{ color: tokens.inkSoft }}>
                          {opt.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Card>

      <Typography variant="caption" sx={{ display: "block", mt: 2, color: tokens.inkFaint }}>
        <Link to="/forms" style={{ color: "inherit", textDecoration: "none" }}>
          ← Back to forms
        </Link>
      </Typography>
    </Box>
  );
}
