import "../lib/chartSetup";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import { api, ApiError, normalizeError } from "../lib/api";
import type { DashboardResponse } from "../lib/types";
import { PageHeader, EmptyState } from "../components/ui/Misc";
import { useAuth } from "../context/AuthContext";
import { tokens } from "../theme";
import { format, parseISO } from "date-fns";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    api
      .get<DashboardResponse>("/dashboard")
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError((normalizeError(err) as ApiError).message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Box>
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${user?.first_name ?? ""}`}
        description="A running tally of your forms and the responses coming in."
      />

      {isLoading && (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 4 }}>
              <Skeleton variant="rounded" height={110} />
            </Grid>
          ))}
        </Grid>
      )}

      {error && !isLoading && <EmptyState title="Couldn't load the dashboard" description={error} />}

      {data && !isLoading && (
        <Stack spacing={4}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="Total forms" value={data.total_forms} color={tokens.ledger} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="Total responses" value={data.total_responses} color={tokens.moss} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <StatCard label="Responses today" value={data.response_analytics.responses_today} color={tokens.ochre} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <MiniStat label="This week" value={data.response_analytics.responses_this_week} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <MiniStat label="This month" value={data.response_analytics.responses_this_month} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <MiniStat label="Forms tracked" value={data.total_forms} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
                  Submission trends
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Responses over time
                </Typography>
                {data.submission_trends.length === 0 ? (
                  <Typography variant="body2" sx={{ color: tokens.inkFaint, textAlign: "center", py: 5 }}>
                    No submissions recorded yet.
                  </Typography>
                ) : (
                  <Box sx={{ height: 224 }}>
                    <Line
                      data={{
                        labels: data.submission_trends.map((t) => formatDateLabel(t.date)),
                        datasets: [
                          {
                            label: "Responses",
                            data: data.submission_trends.map((t) => t.count),
                            borderColor: tokens.ledger,
                            backgroundColor: "rgba(40, 70, 107, 0.15)",
                            fill: true,
                            tension: 0.35,
                            pointRadius: 2,
                          },
                        ],
                      }}
                      options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          x: { grid: { display: false }, ticks: { color: tokens.inkFaint, font: { size: 11 } } },
                          y: {
                            beginAtZero: true,
                            ticks: { precision: 0, color: tokens.inkFaint, font: { size: 11 } },
                            grid: { color: tokens.hairline },
                          },
                        },
                      }}
                    />
                  </Box>
                )}
              </Card>
            </Grid>

            <Grid size={{ xs: 12, lg: 5 }}>
              <Card sx={{ p: 3, borderRadius: 2, height: "100%" }}>
                <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
                  Most used
                </Typography>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Frequently used forms
                </Typography>
                {data.most_frequently_used_forms.length === 0 ? (
                  <Typography variant="body2" sx={{ color: tokens.inkFaint, textAlign: "center", py: 4 }}>
                    No form activity yet.
                  </Typography>
                ) : (
                  <Stack divider={<Box sx={{ borderBottom: `1px solid ${tokens.hairline}` }} />}>
                    {data.most_frequently_used_forms.map((f, i) => (
                      <Box key={f.form_id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.25 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                          <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
                            {String(i + 1).padStart(2, "0")}
                          </Typography>
                          <Typography
                            component={Link}
                            to={`/forms/${f.form_id}`}
                            variant="body2"
                            noWrap
                            sx={{ fontWeight: 600, color: tokens.ink, textDecoration: "none", "&:hover": { color: tokens.ledger, textDecoration: "underline" } }}
                          >
                            {f.form_title}
                          </Typography>
                        </Box>
                        <Chip
                          label={f.response_count}
                          size="small"
                          sx={{ bgcolor: tokens.ledgerSoft, color: tokens.ledgerDeep, fontWeight: 600, textTransform: "none", fontFamily: '"IBM Plex Mono", monospace' }}
                        />
                      </Box>
                    ))}
                  </Stack>
                )}
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </Box>
  );
}

function formatDateLabel(value: string) {
  try {
    return format(parseISO(value), "MMM d");
  } catch {
    return value;
  }
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ color, mt: 0.5 }}>
        {value}
      </Typography>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: `1px solid ${tokens.hairline}`,
        borderRadius: 1.5,
        bgcolor: tokens.card,
        px: 2,
        py: 1.5,
      }}
    >
      <Typography variant="body2" sx={{ color: tokens.inkSoft }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}>
        {value}
      </Typography>
    </Box>
  );
}
