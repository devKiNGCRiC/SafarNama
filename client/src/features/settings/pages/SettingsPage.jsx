import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getSettings } from "../api";
import NotificationSection from "../components/NotificationSection";
import SecuritySection from "../components/SecuritySection";
import BlockedSection from "../components/BlockedSection";
import DangerSection from "../components/DangerSection";
import "../settings.scss";

const SECTIONS = [
  ["account", "Account"],
  ["notifications", "Notifications"],
  ["security", "Password & security"],
  ["blocked", "Blocked people"],
  ["danger", "Deactivate"],
];

const SettingsPage = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getSettings()
      .then((r) => alive && setData(r.data))
      .catch(() => alive && setError("Could not load your settings. Please try again."));
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <div className="st-page"><div className="st-wrap st-state">{error}</div></div>;
  if (!data) return <div className="st-page"><div className="st-wrap st-state">Loading…</div></div>;

  const { account, preferences } = data;
  const setPrefs = (notifications) => setData((d) => ({ ...d, preferences: { ...d.preferences, notifications } }));

  return (
    <div className="st-page">
      <div className="st-wrap">
        <h1>Settings</h1>
        <div className="st-layout">
          <nav className="st-nav" aria-label="Settings sections">
            {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
          </nav>

          <div className="st-main">
            <section className="st-card" id="account">
              <h2>Account</h2>
              <dl className="st-facts">
                <div><dt>Name</dt><dd>{account.firstName} {account.lastName}</dd></div>
                <div><dt>Username</dt><dd>@{account.username}</dd></div>
                <div>
                  <dt>Email</dt>
                  <dd>{account.email} <em className={account.isEmailVerified ? "ok" : "warn"}>{account.isEmailVerified ? "verified" : "not verified"}</em></dd>
                </div>
                <div><dt>Member since</dt><dd>{new Date(account.memberSince).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</dd></div>
              </dl>
              <Link to="/profile" className="st-btn ghost">Edit profile</Link>
            </section>

            <NotificationSection prefs={preferences.notifications} onChange={setPrefs} />
            <SecuritySection />
            <BlockedSection />
            <DangerSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
