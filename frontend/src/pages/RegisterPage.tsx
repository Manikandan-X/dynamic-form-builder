import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../lib/api";
import { AuthLayout } from "./AuthLayout";
import { tokens } from "../theme";

interface RegisterFormValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerUser(values);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
        if (err.fieldErrors) {
          Object.entries(err.fieldErrors).forEach(([field, message]) => {
            if (field in values) {
              setError(field as keyof RegisterFormValues, { message });
            }
          });
        }
      } else {
        setServerError("Could not create your account.");
      }
    }
  };

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Open a new ledger entry"
      description="Register to start building forms, collecting responses, and reviewing reports."
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={1.5}>
          <Grid size={6}>
            <TextField
              label="First name"
              fullWidth
              error={!!errors.first_name}
              helperText={errors.first_name?.message}
              {...register("first_name", { required: "Required." })}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              label="Last name"
              fullWidth
              error={!!errors.last_name}
              helperText={errors.last_name?.message}
              {...register("last_name", { required: "Required." })}
            />
          </Grid>
        </Grid>
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
          autoComplete="new-password"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message ?? "At least 8 characters."}
          {...register("password", {
            required: "Password is required.",
            minLength: { value: 8, message: "At least 8 characters." },
          })}
        />
        {serverError && <Alert severity="error">{serverError}</Alert>}
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </Stack>
      <Typography variant="body2" sx={{ mt: 3, textAlign: "center", color: tokens.inkSoft }}>
        Already registered?{" "}
        <Link to="/login" style={{ color: tokens.ledger, fontWeight: 600, textDecoration: "none" }}>
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}
