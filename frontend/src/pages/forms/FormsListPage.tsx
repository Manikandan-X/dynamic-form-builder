import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { FormResponseDto } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { Stamp } from "../../components/ui/Stamp";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { tokens } from "../../theme";
import { format, parseISO } from "date-fns";

type Scope = "all" | "mine";

export default function FormsListPage() {
  const { isAdmin } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [scope, setScope] = useState<Scope>("all");
  const [forms, setForms] = useState<FormResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<FormResponseDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    const url = scope === "mine" ? "/forms/my" : "/forms";
    api
      .get<FormResponseDto[]>(url)
      .then((res) => setForms(res.data))
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, [scope]);

  const filtered = forms.filter((f) => f.title.toLowerCase().includes(query.toLowerCase()));

  const handleToggleStatus = async (form: FormResponseDto) => {
    setTogglingId(form.id);
    try {
      await api.patch(`/forms/${form.id}/status`, null, { params: { is_active: !form.is_active } });
      push(`"${form.title}" is now ${!form.is_active ? "active" : "inactive"}.`, "success");
      load();
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/forms/${pendingDelete.id}`);
      push(`"${pendingDelete.title}" was deleted.`, "success");
      setPendingDelete(null);
      load();
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        eyebrow="Forms"
        title="Form registry"
        description="Every form in the ledger, active or retired."
        actions={isAdmin ? <Button variant="contained" onClick={() => navigate("/forms/new")}>+ New form</Button> : undefined}
      />

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="space-between" sx={{ mb: 3 }}>
        <Tabs value={scope} onChange={(_, v) => setScope(v)} sx={{ minHeight: 36 }}>
          <Tab value="all" label="All forms" sx={{ minHeight: 36, textTransform: "none" }} />
          <Tab value="mine" label="Created by me" sx={{ minHeight: 36, textTransform: "none" }} />
        </Tabs>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search forms…"
          size="small"
          sx={{ width: { xs: "100%", sm: 240 } }}
        />
      </Stack>

      {isLoading && (
        <Grid container spacing={2}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Skeleton variant="rounded" height={144} />
            </Grid>
          ))}
        </Grid>
      )}

      {error && !isLoading && <EmptyState title="Couldn't load forms" description={error} />}

      {!isLoading && !error && filtered.length === 0 && (
        <EmptyState
          title="No forms yet"
          description={isAdmin ? "Create your first form to start collecting responses." : "No forms have been published yet."}
          action={isAdmin ? <Button variant="contained" onClick={() => navigate("/forms/new")}>+ New form</Button> : undefined}
        />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <Grid container spacing={2}>
          {filtered.map((form) => (
            <Grid key={form.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card sx={{ p: 2.5, borderRadius: 2, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, mb: 1 }}>
                    <Typography
                      component={Link}
                      to={`/forms/${form.id}`}
                      variant="h6"
                      sx={{ color: tokens.ink, textDecoration: "none", lineHeight: 1.25, "&:hover": { color: tokens.ledger } }}
                    >
                      {form.title}
                    </Typography>
                    <Stamp tone={form.is_active ? "moss" : "faint"} label={form.is_active ? "Active" : "Inactive"} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: tokens.inkSoft, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {form.description || "No description provided."}
                  </Typography>
                </Box>
                <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${tokens.hairline}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
                    {format(parseISO(form.created_at), "MMM d, yyyy")}
                  </Typography>
                  <Stack direction="row" spacing={0.5}>
                    <Button size="small" component={Link} to={`/forms/${form.id}`}>
                      View
                    </Button>
                    {isAdmin && (
                      <>
                        <Button size="small" component={Link} to={`/forms/${form.id}/edit`} sx={{ color: tokens.inkSoft }}>
                          Edit
                        </Button>
                        <Button size="small" onClick={() => handleToggleStatus(form)} disabled={togglingId === form.id} sx={{ color: tokens.ochre }}>
                          {form.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button size="small" onClick={() => setPendingDelete(form)} sx={{ color: tokens.rust }}>
                          Delete
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this form?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: tokens.inkSoft }}>
            "{pendingDelete?.title}" and all of its fields will be permanently removed. Responses already submitted will
            also be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
            Delete form
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
