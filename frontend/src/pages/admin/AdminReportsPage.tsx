import "../../lib/chartSetup";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import LinearProgress from "@mui/material/LinearProgress";
import { api, ApiError, normalizeError } from "../../lib/api";
import type {
  FormAnalyticsResponse,
  FormResponseDto,
  FormResponseStatistics,
  ResponseStatisticsResponse,
  ResponseTrendResponse,
} from "../../lib/types";
import { PageHeader, EmptyState } from "../../components/ui/Misc";
import { useToast } from "../../context/ToastContext";
import { tokens } from "../../theme";
import { format, parseISO, subDays } from "date-fns";

export default function AdminReportsPage() {
  const { push } = useToast();
  const [stats, setStats] = useState<ResponseStatisticsResponse | null>(null);
  const [formStats, setFormStats] = useState<FormResponseStatistics[]>([]);
  const [forms, setForms] = useState<FormResponseDto[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [analytics, setAnalytics] = useState<FormAnalyticsResponse | null>(null);
  const [trend, setTrend] = useState<ResponseTrendResponse | null>(null);
  const [fromDate, setFromDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [toDate, setToDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [exportingType, setExportingType] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      api.get<ResponseStatisticsResponse>("/reports/statistics"),
      api.get<FormResponseStatistics[]>("/reports/forms"),
      api.get<FormResponseDto[]>("/forms"),
    ])
      .then(([s, fs, f]) => {
        setStats(s.data);
        setFormStats(fs.data);
        setForms(f.data);
      })
      .catch((err) => setError((normalizeError(err) as ApiError).message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFormId) {
      setAnalytics(null);
      return;
    }
    setIsLoadingAnalytics(true);
    api
      .get<FormAnalyticsResponse>(`/reports/forms/${selectedFormId}/analytics`)
      .then((res) => setAnalytics(res.data))
      .catch((err) => push((normalizeError(err) as ApiError).message, "error"))
      .finally(() => setIsLoadingAnalytics(false));
  }, [selectedFormId, push]);

  const loadTrend = () => {
    setIsLoadingTrend(true);
    api
      .get<ResponseTrendResponse>("/reports/trend", { params: { from_date: fromDate, to_date: toDate, form_id: selectedFormId || undefined } })
      .then((res) => setTrend(res.data))
      .catch((err) => push((normalizeError(err) as ApiError).message, "error"))
      .finally(() => setIsLoadingTrend(false));
  };

  useEffect(loadTrend, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (type: "excel" | "pdf") => {
    setExportingType(type);
    try {
      const res = await api.get(`/reports/export/${type}`, { responseType: "blob", params: { form_id: selectedFormId || undefined } });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `form_response_report.${type === "excel" ? "xlsx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      push("Export ready — check your downloads.", "success");
    } catch (err) {
      push((normalizeError(err) as ApiError).message, "error");
    } finally {
      setExportingType(null);
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={48} />
        <Skeleton variant="rounded" height={160} />
      </Stack>
    );
  }

  if (error) return <EmptyState title="Couldn't load reports" description={error} />;

  return (
    <Box>
      <PageHeader
        eyebrow="Administration"
        title="Reports"
        description="Response statistics, form-wise analytics, and downloadable exports."
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => handleExport("excel")} disabled={exportingType === "excel"}>
              Export Excel
            </Button>
            <Button variant="outlined" onClick={() => handleExport("pdf")} disabled={exportingType === "pdf"}>
              Export PDF
            </Button>
          </Stack>
        }
      />

      {stats && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard label="Total" value={stats.total_responses} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard label="Today" value={stats.responses_today} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard label="This week" value={stats.responses_this_week} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard label="This month" value={stats.responses_this_month} />
          </Grid>
        </Grid>
      )}

      <Card sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
          Responses per form
        </Typography>
        {formStats.length === 0 ? (
          <Typography variant="body2" sx={{ color: tokens.inkFaint, textAlign: "center", py: 3 }}>
            No response data yet.
          </Typography>
        ) : (
          <Stack divider={<Box sx={{ borderBottom: `1px solid ${tokens.hairline}` }} />} sx={{ mt: 1.5 }}>
            {formStats
              .slice()
              .sort((a, b) => b.total_responses - a.total_responses)
              .map((fs) => (
                <Box key={fs.form_id} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.25 }}>
                  <Typography variant="body2">{fs.form_title}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ bgcolor: tokens.ledgerSoft, color: tokens.ledgerDeep, px: 1.25, py: 0.25, borderRadius: 5, fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}
                  >
                    {fs.total_responses}
                  </Typography>
                </Box>
              ))}
          </Stack>
        )}
      </Card>

      <Card sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="flex-end" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
              Response trend
            </Typography>
            <Typography variant="h6">Submissions in range</Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField label="From" type="date" size="small" value={fromDate} onChange={(e) => setFromDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="To" type="date" size="small" value={toDate} onChange={(e) => setToDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <Button size="small" variant="outlined" onClick={loadTrend} disabled={isLoadingTrend}>
              Update
            </Button>
          </Stack>
        </Stack>
        {!trend || trend.data.length === 0 ? (
          <Typography variant="body2" sx={{ color: tokens.inkFaint, textAlign: "center", py: 5 }}>
            No submissions in this range.
          </Typography>
        ) : (
          <Box sx={{ height: 224 }}>
            <Bar
              data={{
                labels: trend.data.map((d) => {
                  try {
                    return format(parseISO(d.date), "MMM d");
                  } catch {
                    return d.date;
                  }
                }),
                datasets: [
                  {
                    label: "Responses",
                    data: trend.data.map((d) => d.count),
                    backgroundColor: tokens.ledger,
                    borderRadius: 3,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: tokens.inkFaint, font: { size: 11 } } },
                  y: { beginAtZero: true, ticks: { precision: 0, color: tokens.inkFaint, font: { size: 11 } }, grid: { color: tokens.hairline } },
                },
              }}
            />
          </Box>
        )}
      </Card>

      <Card sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.68rem" }}>
              Field-level analytics
            </Typography>
            <Typography variant="h6">Per-form breakdown</Typography>
          </Box>
          <TextField select size="small" label="Form" value={selectedFormId} onChange={(e) => setSelectedFormId(e.target.value)} sx={{ width: 240 }}>
            <MenuItem value="">Select a form…</MenuItem>
            {forms.map((f) => (
              <MenuItem key={f.id} value={f.id}>
                {f.title}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {!selectedFormId && (
          <Typography variant="body2" sx={{ color: tokens.inkFaint, textAlign: "center", py: 4 }}>
            Choose a form to see field-level analytics.
          </Typography>
        )}
        {isLoadingAnalytics && <Skeleton variant="rounded" height={160} />}

        {analytics && !isLoadingAnalytics && (
          <Stack spacing={2}>
            <Typography variant="body2" sx={{ color: tokens.inkSoft }}>
              <Box component="span" sx={{ fontWeight: 700, color: tokens.ink }}>
                {analytics.total_responses}
              </Box>{" "}
              total responses to this form.
            </Typography>
            {analytics.fields.map((field) => (
              <Box key={field.field_id} sx={{ border: `1px solid ${tokens.hairline}`, bgcolor: tokens.paper, borderRadius: 1, px: 2, py: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {field.field_label}
                  </Typography>
                  <Typography variant="caption" sx={{ fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
                    {field.total_responses} answered
                  </Typography>
                </Stack>
                {field.options.length > 0 && (
                  <Stack spacing={1}>
                    {field.options.map((opt) => {
                      const pct = field.total_responses > 0 ? Math.round((opt.count / field.total_responses) * 100) : 0;
                      return (
                        <Stack key={opt.option} direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="caption" sx={{ width: 112, flexShrink: 0, color: tokens.inkSoft }} noWrap>
                            {opt.option}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ flex: 1, height: 8, borderRadius: 1, bgcolor: "rgba(183,176,154,0.35)", "& .MuiLinearProgress-bar": { bgcolor: tokens.ledger } }}
                          />
                          <Typography variant="caption" sx={{ width: 32, flexShrink: 0, textAlign: "right", fontFamily: '"IBM Plex Mono", monospace', color: tokens.inkFaint }}>
                            {opt.count}
                          </Typography>
                        </Stack>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 2 }}>
      <Typography variant="overline" sx={{ color: tokens.inkFaint, fontSize: "0.65rem" }}>
        {label}
      </Typography>
      <Typography variant="h4" sx={{ mt: 0.5 }}>
        {value}
      </Typography>
    </Card>
  );
}
