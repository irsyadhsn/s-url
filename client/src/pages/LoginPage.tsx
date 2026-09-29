import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthCard } from "../components/auth/AuthCard";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { useAuth } from "../hooks/useAuth";
import { parseError, type FieldErrors } from "../lib/errors";
import { loginSchema } from "../schemas/auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: string; notice?: string } | null)?.from ??
    "/dashboard";
  const notice =
    (location.state as { from?: string; notice?: string } | null)?.notice;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFieldErrors({});
    setFormError(null);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(parseError(parsed.error).fields);
      return;
    }

    setSubmitting(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      navigate(from, { replace: true });
    } catch (err) {
      // Inline banner for form-level API errors (bad credentials, network);
      // field errors stay on their inputs. No toast — the message is already
      // in context, right above the submit button.
      const { fields, message } = parseError(err);
      if (Object.keys(fields).length > 0) {
        setFieldErrors(fields);
      } else {
        setFormError(message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your short links."
      footer={
        <>
          No account?{" "}
          <Link
            to="/register"
            className="font-medium text-indigo-600 underline-offset-4 hover:text-indigo-700 hover:underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      {notice ? <Banner variant="success" message={notice} className="mb-4" /> : null}

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
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          required
        />

        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Log in
        </Button>
      </form>
    </AuthCard>
  );
}
