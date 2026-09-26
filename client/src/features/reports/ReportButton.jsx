import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Flag } from "lucide-react";
import useRequireLogin from "../forum/hooks/useRequireLogin";
import { sendReport } from "./api";
import { REPORT_REASONS } from "./reportLabels";
import "./reports.scss";

// "Report" link + dialog. Only render it for content that is not the viewer's own.
const ReportButton = ({ type, targetId, className = "", label = "Report" }) => {
  const requireLogin = useRequireLogin();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && !busy && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await sendReport({ type, targetId, reason, details: details.trim() });
      toast.success(res.message || "Thank you. Our team will take a look.");
      setOpen(false);
      setDetails("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not send the report. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`rp-trigger ${className}`}
        onClick={() => requireLogin("report content") && setOpen(true)}
        aria-label="Report this content"
      >
        <Flag size={14} /> {label}
      </button>
      {open && (
        <div className="rp-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && setOpen(false)}>
          <form className="rp-modal" onSubmit={submit}>
            <h3>Report this content</h3>
            <p>What is wrong with it?</p>
            {REPORT_REASONS.map((r) => (
              <label key={r.id} className="rp-radio">
                <input type="radio" name="report-reason" value={r.id} checked={reason === r.id} onChange={() => setReason(r.id)} />
                {r.label}
              </label>
            ))}
            <label htmlFor="rp-details">More details (optional)</label>
            <textarea id="rp-details" rows={3} maxLength={300} value={details} onChange={(e) => setDetails(e.target.value)} />
            {error && <p className="rp-error" role="alert">{error}</p>}
            <div className="rp-actions">
              <button type="button" className="rp-btn ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</button>
              <button className="rp-btn" disabled={busy}>{busy ? "Sending…" : "Send report"}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ReportButton;
