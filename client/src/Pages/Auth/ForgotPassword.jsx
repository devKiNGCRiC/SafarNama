import React, { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/authRequest";
import "./PasswordPages.scss";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | sent
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setStatus("sending");
    try {
      await forgotPassword(value);
      setStatus("sent");
    } catch (err) {
      setError(err?.message || "Could not send the email. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="pw-page">
      <div className="pw-card">
        <h1>Forgot your password?</h1>

        {status === "sent" ? (
          <>
            <p className="pw-ok">
              If an account exists for <strong>{email.trim()}</strong>, we have sent a link to reset the password.
              It stays valid for 1 hour.
            </p>
            <p className="pw-hint">Nothing in your inbox? Check spam, or try again in a few minutes.</p>
            <Link to="/auth" className="pw-btn">Back to sign in</Link>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <p>Enter the email address you signed up with and we will send you a reset link.</p>
            <label htmlFor="pw-email">Email</label>
            <input
              id="pw-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {error && <div className="pw-error">{error}</div>}
            <button className="pw-btn" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send reset link"}
            </button>
            <Link to="/auth" className="pw-link">Back to sign in</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
