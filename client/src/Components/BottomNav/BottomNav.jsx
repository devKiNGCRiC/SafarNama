import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Camera, Compass, Home, LogIn, MessageCircle, User } from "lucide-react";
import UnreadBadge from "../../features/chat/components/UnreadBadge";
import { activeTab, showBottomNav } from "../../config/navTabs";
import "./BottomNav.scss";

// Phone-only tab bar with the five places people go most. (The wide-screen navbar and the
// hamburger menu still hold everything else.)
const BottomNav = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const hidden = !showBottomNav(pathname);

  // leave room at the bottom of every page so the bar never covers the last content
  useEffect(() => {
    document.body.classList.toggle("has-bottom-nav", !hidden);
    return () => document.body.classList.remove("has-bottom-nav");
  }, [hidden]);

  if (hidden) return null;
  const current = activeTab(pathname);

  const tabs = [
    { id: "home", to: "/home", label: "Home", icon: Home },
    { id: "explore", to: "/destinations", label: "Explore", icon: Compass },
    { id: "safargram", to: "/safargram", label: "SafarGram", icon: Camera },
    { id: "chat", to: "/chat", label: "Chat", icon: MessageCircle, badge: true },
    isAuthenticated
      ? { id: "profile", to: "/profile", label: "Profile", icon: User }
      : { id: "profile", to: "/auth", label: "Log in", icon: LogIn },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to={tab.to}
          className={`bottom-nav-item ${current === tab.id ? "active" : ""}`}
          aria-current={current === tab.id ? "page" : undefined}
        >
          <span className="bottom-nav-icon">
            <tab.icon size={22} strokeWidth={current === tab.id ? 2.4 : 2} />
            {tab.badge && isAuthenticated && <UnreadBadge />}
          </span>
          <span className="bottom-nav-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;
