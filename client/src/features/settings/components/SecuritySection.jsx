import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { changePassword, signOutEverywhere } from "../api";
import { checkPassword, passwordFormError } from "../utils/passwordRules";
import { loginSuccess } from "../../../store/reducers/authSlice";

const EMPTY = { current: "", next: "", confirm: "" };

// Change password + sign out of other devices. Both make the server end every older login,
// and both hand back a fresh token so THIS browser stays signed in.
const SecuritySection = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const keepSignedIn = (token) => dispatch(loginSuccess({ user, token }));
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const problem = passwordFormError(form);
    if (problem) return setError(problem);

    setBusy(true);
    setError("");
    try {
      const res = await changePassword(form.current, form.next);
      keepSignedIn(res.token);
      setForm(EMPTY);
      toast.success("Password changed. Other devices were signed out.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not change the password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const signOutOthers = async () => {
    if (!window.confirm("Sign out of every other device and browser?")) return;
    setSigningOut(true);
    try {
      const res = await signOutEverywhere();
      keepSignedIn(res.token);
      toast.success("Signed out of all other devices");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not sign out other devices");
    } finally {
      setSigningOut(false);
    }
  };

  const rules = checkPassword(form.next);

  return (
    <section className="st-card" id="security">
      <h2>Password &amp; security</h2>
      <form onSubmit={submit} autoComplete="off">
        <label htmlFor="st-current">Current password</label>
        <input id="st-current" type="password" autoComplete="current-password" value={form.current} onChange={set("current")} />

        <label htmlFor="st-new">New password</label>
        <input id="st-new" type="password" autoComplete="new-password" value={form.next} onChange={set("next")} />
        {form.next && (
          <ul className="st-rules">
            {rules.map((r) => <li key={r.id} className={r.ok ? "ok" : ""}>{r.ok ? "✓" : "○"} {r.label}</li>)}
          </ul>
        )}

        <label htmlFor="st-confirm">Confirm new password</label>
        <input id="st-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} />

        {error && <p className="st-error" role="alert">{error}</p>}
        <button className="st-btn" disabled={busy}>{busy ? "Changing…" : "Change password"}</button>
      </form>

      <hr />
      <div className="st-row">
        <span>
          <strong>Sign out of other devices</strong>
          <small>Lost a phone or used a shared computer? This ends every other login. You stay signed in here.</small>
        </span>
        <button type="button" className="st-btn ghost" onClick={signOutOthers} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out others"}
        </button>
      </div>
    </section>
  );
};

export default SecuritySection;
