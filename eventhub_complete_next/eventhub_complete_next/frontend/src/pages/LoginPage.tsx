import { useState, type FormEvent } from "react";
import { api } from "../api/client";

type LoginPageProps = {
  onDone: () => void;
  onSignup: () => void;
};

export default function LoginPage({ onDone, onSignup }: LoginPageProps) {
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      });
      localStorage.setItem("eh_token", data.access_token);
      localStorage.setItem("eh_user", JSON.stringify(data.user));
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to sign in.");
    }
  }

  return (
    <section className="auth">
      <form className="card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <input
          required
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
        />
        <input
          required
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={values.password}
          onChange={(event) =>
            setValues((current) => ({ ...current, password: event.target.value }))
          }
        />
        <button className="primary" type="submit">
          Login
        </button>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <button className="link" type="button" onClick={onSignup}>
          Create account
        </button>
      </form>
    </section>
  );
}
