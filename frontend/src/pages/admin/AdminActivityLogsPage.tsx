import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Skeleton from "@mui/material/Skeleton";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { ActivityLogResponse } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { Stamp } from "../../components/ui/Stamp";
import { tokens } from "../../theme";
import { format, parseISO } from "date-fns";

const ACTION_TONE: Record<string, "moss" | "ochre" | "rust" | "ledger" | "faint"> = {
  CREATE_FORM: "moss",
  UPDATE_FORM: "ledger",
  DELETE_FORM: "rust",
  UPDATE_FORM_STATUS: "ochre",
  CREATE_FORM_FIELD: "moss",
  UPDATE_FORM_FIELD: "ledger",
  DELETE_FORM_FIELD: "rust",
  SUBMITTED: "moss",
  UPDATED: "ledger",
  UPLOAD_FILE: "ochre",
};

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLogResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api
      .get<ActivityLogResponse[]>("/activity-logs")
      .then((res) => setLogs(res.data.slice().sort((a, b) => b.id - a.id)))
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = logs.filter(
    (l) => l.action.toLowerCase().includes(query.toLowerCase()) || (l.description ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Box>
      <PageHeader eyebrow="Administration" title="Activity log" description="A running record of what happened, and when." />

      <TextField value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actions or descriptions…" size="small" sx={{ mb: 3, width: { xs: "100%", sm: 320 } }} />

      {isLoading && <Skeleton variant="rounded" height={280} />}
      {error && !isLoading && <EmptyState title="Couldn't load the activity log" description={error} />}

      {!isLoading && !error && filtered.length === 0 && <EmptyState title="No activity recorded" description="Actions across the system will appear here." />}

      {!isLoading && !error && filtered.length > 0 && (
        <Card sx={{ borderRadius: 2 }}>
          <Stack divider={<Box sx={{ borderBottom: `1px solid ${tokens.hairline}` }} />}>
            {filtered.map((log) => (
              <Stack key={log.id} direction="row" spacing={2} alignItems="flex-start" sx={{ px: 2.5, py: 1.75 }}>
                <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint, mt: 0.25, flexShrink: 0 }}>
                  {format(parseISO(log.created_at), "MMM d, h:mm a")}
                </Typography>
                <Stamp tone={ACTION_TONE[log.action] ?? "faint"} label={log.action.replaceAll("_", " ")} />
                <Typography variant="body2" sx={{ color: tokens.inkSoft, flex: 1, minWidth: 0 }}>
                  {log.description ?? "—"}
                </Typography>
                {log.user_id && (
                  <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint, flexShrink: 0 }}>
                    User #{log.user_id}
                  </Typography>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </Box>
  );
}
