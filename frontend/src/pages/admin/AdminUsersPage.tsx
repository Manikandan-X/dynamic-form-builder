import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Card from "@mui/material/Card";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { RoleResponse, UserManagementResponse } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { Stamp } from "../../components/ui/Stamp";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { format, parseISO } from "date-fns";

interface EditUserFormValues {
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { push } = useToast();
  const [users, setUsers] = useState<UserManagementResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<UserManagementResponse | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserManagementResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setIsLoading(true);
    Promise.all([api.get<UserManagementResponse[]>("/users"), api.get<RoleResponse[]>("/roles")])
      .then(([u, r]) => {
        setUsers(u.data);
        setRoles(r.data);
      })
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const filtered = users.filter((u) => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(query.toLowerCase()));

  const handleToggleStatus = async (u: UserManagementResponse) => {
    try {
      await api.patch(`/users/${u.id}/status`, null, { params: { is_active: !u.is_active } });
      push(`${u.first_name} is now ${!u.is_active ? "active" : "inactive"}.`, "success");
      load();
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${pendingDelete.id}`);
      push(`${pendingDelete.first_name} was removed.`, "success");
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
      <PageHeader eyebrow="Administration" title="Users" description="Manage accounts, roles, and access." />

      <TextField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" size="small" sx={{ mb: 3, width: { xs: "100%", sm: 280 } }} />

      {isLoading && <Skeleton variant="rounded" height={280} />}
      {error && !isLoading && <EmptyState title="Couldn't load users" description={error} />}

      {!isLoading && !error && (
        <Card sx={{ borderRadius: 2, overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell sx={{ fontWeight: 600 }}>
                    {u.first_name} {u.last_name}
                    {currentUser?.id === u.id && (
                      <Typography component="span" variant="caption" sx={{ ml: 0.75, color: "text.disabled" }}>
                        (you)
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Stamp tone="ledger" label={u.role} />
                  </TableCell>
                  <TableCell>
                    <Stamp tone={u.is_active ? "moss" : "rust"} label={u.is_active ? "Active" : "Inactive"} />
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: "0.75rem" }}>
                    {format(parseISO(u.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Button size="small" onClick={() => setEditing(u)}>
                        Edit
                      </Button>
                      <Button size="small" color="warning" onClick={() => handleToggleStatus(u)}>
                        {u.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      {currentUser?.id !== u.id && (
                        <Button size="small" color="error" onClick={() => setPendingDelete(u)}>
                          Delete
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <Typography variant="body2" sx={{ textAlign: "center", py: 5, color: "text.disabled" }}>
              No users match your search.
            </Typography>
          )}
        </Card>
      )}

      {editing && (
        <EditUserDialog
          user={editing}
          roles={roles}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      <Dialog open={!!pendingDelete} onClose={() => setPendingDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this user?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {pendingDelete?.first_name} {pendingDelete?.last_name} will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
            Delete user
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function EditUserDialog({
  user,
  roles,
  onClose,
  onSaved,
}: {
  user: UserManagementResponse;
  roles: RoleResponse[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { push } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<EditUserFormValues>({
    defaultValues: { first_name: user.first_name, last_name: user.last_name, email: user.email, role_id: user.role_id },
  });

  const onSubmit = async (values: EditUserFormValues) => {
    setServerError(null);
    try {
      await api.put(`/users/${user.id}`, values);
      push("User updated.", "success");
      onSaved();
    } catch (err) {
      setServerError((normalizeError(err) as ApiError).message);
    }
  };

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit user</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Stack direction="row" spacing={2}>
            <Controller name="first_name" control={control} render={({ field }) => <TextField {...field} label="First name" fullWidth />} />
            <Controller name="last_name" control={control} render={({ field }) => <TextField {...field} label="Last name" fullWidth />} />
          </Stack>
          <Controller name="email" control={control} render={({ field }) => <TextField {...field} label="Email" type="email" fullWidth />} />
          <Controller
            name="role_id"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Role" fullWidth onChange={(e) => field.onChange(Number(e.target.value))}>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          {serverError && <Alert severity="error">{serverError}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
