import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../../api/authRequest";
import "./PasswordPages.scss";

// Same rules the server enforces, so people get instant feedback.
export function passwordProblem(password) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(password)) return "Add a lowercase letter.";
  if (!/[A-Z]/.test(password)) return "Add an uppercase letter.";
  if (!/\d/.test(password)) return "Add a number.";
  if (!/[@$!%*?&]/.test(password)) return "Add one special character (@ $ ! % * ? &).";
  return null;
}

// Opened from the link in the password-reset email: /reset-password/:token
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const problem = passwordProblem(password);
    if (problem) return setError(problem);
    if (password !== confirm) return setError("The two passwords do not match.");

    setError("");
    setBusy(true);
    try {
      await resetPassword(token, password);
      toast.success("Password updated. Please sign in with your new password.");
      navigate("/auth", { replace: true });
    } catch (err) {
      setError(err?.message || "This reset link is invalid or has expired.");
      setBusy(false);
    }
  };

  return (
    <div className="pw-page">
      <div className="pw-card">
        <h1>Choose a new password</h1>
        <form onSubmit={submit} noValidate>
          <label htmlFor="pw-new">New password</label>
          <input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="pw-confirm">Confirm password</label>
          <input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <p className="pw-hint">At least 8 characters with upper and lower case letters, a number and a symbol (@ $ ! % * ? &).</p>
          {error && (
            <div className="pw-error">
              {error}{" "}
              {/expired|invalid/i.test(error) && <Link to="/forgot-password">Request a new link</Link>}
            </div>
          )}
          <button className="pw-btn" disabled={busy}>{busy ? "Saving…" : "Reset password"}</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
