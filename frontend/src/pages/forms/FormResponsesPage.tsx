import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { FormResponseDto, FormResponseResponseDto } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { format, parseISO } from "date-fns";

export default function FormResponsesPage() {
  const { id } = useParams();
  const [form, setForm] = useState<FormResponseDto | null>(null);
  const [responses, setResponses] = useState<FormResponseResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([api.get<FormResponseDto>(`/forms/${id}`), api.get<FormResponseResponseDto[]>(`/responses/forms/${id}`)])
      .then(([formRes, responsesRes]) => {
        setForm(formRes.data);
        setResponses(responsesRes.data);
      })
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
    return <EmptyState title="Couldn't load responses" description={error ?? undefined} />;
  }

  return (
    <Box>
      <PageHeader
        eyebrow={`Form No. ${String(form.id).padStart(3, "0")}`}
        title={`Responses to "${form.title}"`}
        description={`${responses.length} response${responses.length === 1 ? "" : "s"} collected.`}
      />

      {responses.length === 0 ? (
        <EmptyState title="No responses yet" description="Once people submit this form, they'll appear here." />
      ) : (
        <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Response</TableCell>
                <TableCell>Submitted by</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Last updated</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>#{r.id}</TableCell>
                  <TableCell>{r.user_id ? `User #${r.user_id}` : "Anonymous"}</TableCell>
                  <TableCell>{format(parseISO(r.submitted_at), "MMM d, yyyy · h:mm a")}</TableCell>
                  <TableCell>{format(parseISO(r.updated_at), "MMM d, yyyy · h:mm a")}</TableCell>
                  <TableCell align="right">
                    <Button component={Link} to={`/responses/${r.id}`} size="small">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
