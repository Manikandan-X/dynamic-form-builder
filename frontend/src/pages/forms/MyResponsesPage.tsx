import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import Card from "@mui/material/Card";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import { api, ApiError, normalizeError } from "../../lib/api";
import type { FormResponseResponseDto } from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { format, parseISO } from "date-fns";

export default function MyResponsesPage() {
  const [responses, setResponses] = useState<FormResponseResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<FormResponseResponseDto[]>("/responses/my")
      .then((res) => setResponses(res.data))
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <Box>
      <PageHeader eyebrow="Responses" title="My responses" description="Every response you've submitted, across all forms." />

      {isLoading && <Skeleton variant="rounded" height={220} />}
      {error && !isLoading && <EmptyState title="Couldn't load your responses" description={error} />}

      {!isLoading && !error && responses.length === 0 && (
        <EmptyState
          title="No responses yet"
          description="Fill out a form to see your submissions here."
          action={
            <Button component={Link} to="/forms" variant="contained">
              Browse forms
            </Button>
          }
        />
      )}

      {!isLoading && !error && responses.length > 0 && (
        <Card sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Response</TableCell>
                <TableCell>Fields answered</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {responses.map((r) => (
                <TableRow key={r.id}>
                  <TableCell sx={{ fontFamily: '"IBM Plex Mono", monospace' }}>
                    #{r.id} · Form {r.form_id}
                  </TableCell>
                  <TableCell>{r.details.length}</TableCell>
                  <TableCell>{format(parseISO(r.submitted_at), "MMM d, yyyy · h:mm a")}</TableCell>
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
