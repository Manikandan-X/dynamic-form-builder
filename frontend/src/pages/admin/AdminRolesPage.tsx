import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { RoleResponse } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { useToast } from "../../context/ToastContext";
import { tokens } from "../../theme";
import { format, parseISO } from "date-fns";

interface RoleFormValues {
  name: string;
}

export default function AdminRolesPage() {
  const { push } = useToast();
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoleResponse | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RoleResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<RoleFormValues>({ defaultValues: { name: "" } });

  const load = () => {
    setIsLoading(true);
    api
      .get<RoleResponse[]>("/roles")
      .then((res) => setRoles(res.data))
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    reset({ name: "" });
    setModalOpen(true);
  };

  const openEdit = (role: RoleResponse) => {
    setEditing(role);
    setServerError(null);
    reset({ name: role.name });
    setModalOpen(true);
  };

  const onSubmit = async (values: RoleFormValues) => {
    setServerError(null);
    try {
      if (editing) {
        await api.put(`/roles/${editing.id}`, values);
        push(`Role "${values.name}" updated.`, "success");
      } else {
        await api.post("/roles", values);
        push(`Role "${values.name}" created.`, "success");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setServerError((normalizeError(err) as ApiError).message);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/roles/${pendingDelete.id}`);
      push(`Role "${pendingDelete.name}" deleted.`, "success");
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
        eyebrow="Administration"
        title="Roles"
        description="Roles determine what a user can see and manage."
        actions={<Button variant="contained" onClick={openCreate}>+ New role</Button>}
      />

      {isLoading && <Skeleton variant="rounded" height={200} />}
      {error && !isLoading && <EmptyState title="Couldn't load roles" description={error} />}

      {!isLoading && !error && (
        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid key={role.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card sx={{ p: 2.5, borderRadius: 2, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
                <Box>
                  <Typography variant="h6">{role.name}</Typography>
                  <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
                    Created {format(parseISO(role.created_at), "MMM d, yyyy")}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${tokens.hairline}` }}>
                  <Button size="small" onClick={() => openEdit(role)}>
                    Edit
                  </Button>
                  <Button size="small" color="error" onClick={() => setPendingDelete(role)}>
                    Delete
                  </Button>
                </Stack>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editing ? "Edit role" : "New role"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: true }}
              render={({ field }) => <TextField {...field} label="Role name" fullWidth placeholder="e.g. MANAGER" />}
            />
            {serverError && <Alert severity="error">{serverError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {editing ? "Save changes" : "Create role"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this role?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: tokens.inkSoft }}>
            "{pendingDelete?.name}" will be permanently removed. Users assigned to it may be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
            Delete role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
