import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { parseError, type FieldErrors } from "../lib/errors";
import { registerSchema } from "../schemas/auth";

export function RegisterPage() {
  const { register, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    const parsed = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setFieldErrors(parseError(parsed.error).fields);
      return;
    }

    setSubmitting(true);
    try {
      await register(parsed.data.email, parsed.data.password);
    } catch (err) {
      const { fields, message } = parseError(err);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setFormError(message);
      }
      setSubmitting(false);
      return;
    }

    // Backend register returns no token — follow up with an immediate login
    // so the user lands authenticated without retyping credentials.
    try {
      await login(parsed.data.email, parsed.data.password);
      toast.success("Account created");
      navigate(from, { replace: true });
    } catch {
      navigate("/login", {
        replace: true,
        state: { notice: "Account created — please log in." },
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start shortening and tracking links in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError ? <Banner message={formError} /> : null}

        <TextField
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          required
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />
        <TextField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          required
        />

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
