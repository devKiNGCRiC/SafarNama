import React from "react";
import { NavLink } from "react-router-dom";
import "../admin.scss";

const TABS = [
  ["/admin", "Overview", true],
  ["/admin/users", "Users"],
  ["/admin/reports", "Reports"],
  ["/admin/messages", "Messages"],
  ["/admin/events", "Events"],
  ["/admin/eco-guides", "Guides"],
  ["/admin/destinations", "Destinations"],
  ["/admin/itineraries", "Itineraries"],
];

// Page frame for the admin screens: title, section tabs, then the page itself.
const AdminLayout = ({ title, children }) => (
  <div className="ad-page">
    <div className="ad-wrap">
      <h1>Admin</h1>
      <nav className="ad-tabs" aria-label="Admin sections">
        {TABS.map(([to, label, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? "active" : "")}>{label}</NavLink>
        ))}
      </nav>
      {title && <h2 className="ad-title">{title}</h2>}
      {children}
    </div>
  </div>
);

export default AdminLayout;
