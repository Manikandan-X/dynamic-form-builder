import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { AuthLayout } from "./AuthLayout";
import { tokens } from "../theme";

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ defaultValues: { email: "", password: "" } });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values);
      const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Could not sign in.");
    }
  };

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back to the ledger"
      description="Enter your credentials to access your forms, responses, and reports."
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register("email", { required: "Email is required." })}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register("password", { required: "Password is required." })}
        />
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ mt: 3, textAlign: "center", color: tokens.inkSoft }}>
        New here?{" "}
        <Link to="/register" style={{ color: tokens.ledger, fontWeight: 600, textDecoration: "none" }}>
          Create an account
        </Link>
      </Typography>
    </AuthLayout>
  );
}
