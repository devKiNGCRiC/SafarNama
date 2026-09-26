import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { cancelEventRegistration, registerForEvent } from "../api";
import { eventState } from "../utils/eventFormat";
import "../events.scss";

// One button for every situation: register, registered (with cancel), full, ended, logged out.
// `onChange(updatedEvent)` lets the parent refresh counts without reloading the page.
const RegisterButton = ({ event, onChange }) => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const state = eventState(event);

  const register = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to register for events");
      navigate("/auth", { state: { from: location } });
      return;
    }
    setBusy(true);
    try {
      const res = await registerForEvent(event._id);
      onChange(res.data);
      toast.success("You are registered! See you there.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not register. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const cancel = async () => {
    if (!window.confirm("Cancel your registration for this event?")) return;
    setBusy(true);
    try {
      await cancelEventRegistration(event._id);
      const spotsLeft = event.spotsLeft === null ? null : event.spotsLeft + 1;
      onChange({
        ...event,
        registeredByMe: false,
        registeredCount: Math.max(0, event.registeredCount - 1),
        spotsLeft,
        isFull: false,
      });
      toast.success("Registration cancelled");
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not cancel. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (state === "ended") return <button className="ev-btn" disabled>Event ended</button>;
  if (state === "full") return <button className="ev-btn" disabled>Event full</button>;
  if (state === "registered") {
    return (
      <div className="ev-registered">
        <span className="ev-tick">✓ You are registered</span>
        <button type="button" className="ev-link" onClick={cancel} disabled={busy}>
          {busy ? "Cancelling…" : "Cancel registration"}
        </button>
      </div>
    );
  }
  return (
    <button type="button" className="ev-btn" onClick={register} disabled={busy}>
      {busy ? "Registering…" : isAuthenticated ? "Register" : "Log in to register"}
    </button>
  );
};

export default RegisterButton;
