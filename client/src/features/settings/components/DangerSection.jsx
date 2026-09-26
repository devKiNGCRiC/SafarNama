import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { deactivateAccount } from "../api";
import { logoutUser } from "../../../actions/authAction";

const DangerSection = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !busy && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const confirm = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await deactivateAccount(password);
      await dispatch(logoutUser());
      toast.success("Your account has been deactivated");
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Could not deactivate the account. Please try again.");
      setBusy(false);
    }
  };

  return (
    <section className="st-card danger" id="danger">
      <h2>Deactivate account</h2>
      <p className="st-sub">
        You will be signed out everywhere and will not be able to log in again. Your posts stay as they are, and
        nothing is erased. To get the account back, <Link to="/contact-Us">contact us</Link>.
      </p>
      <button type="button" className="st-btn danger" onClick={() => setOpen(true)}>Deactivate my account</button>

      {open && (
        <div className="st-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <form className="st-modal" onSubmit={confirm}>
            <h3>Deactivate your account?</h3>
            <p>Enter your password to confirm.</p>
            <input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="Your password" />
            {error && <p className="st-error" role="alert">{error}</p>}
            <div className="st-modal-actions">
              <button type="button" className="st-btn ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button className="st-btn danger" disabled={busy || !password}>{busy ? "Working…" : "Deactivate"}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
};

export default DangerSection;
