import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Bookmark, Camera, Compass, Home, User } from "lucide-react";
import "../safargram.scss";

// Left column on desktop: who you are + quick links.
const ProfileRail = () => {
  const me = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  if (!me) return null;

  const name = [me.firstName, me.lastName].filter(Boolean).join(" ") || me.username;
  const active = ({ isActive }) => (isActive ? "active" : "");

  return (
    <>
      <div className="sg-panel sg-me">
        {me.avatar ? (
          <img className="sg-avatar big" src={me.avatar} alt="" />
        ) : (
          <span className="sg-avatar big">{me.username?.[0]?.toUpperCase()}</span>
        )}
        <div className="sg-me-text">
          <strong>{name}</strong>
          <small>@{me.username}</small>
          <Link to={`/profile/${me.username}`}>View profile</Link>
        </div>
      </div>

      <nav className="sg-panel sg-links" aria-label="SafarGram">
        <NavLink to="/safargram" end className={active}>
          <Home size={18} /> Feed
        </NavLink>
        <NavLink to="/safargram/explore" className={active}>
          <Compass size={18} /> Explore
        </NavLink>
        <NavLink to="/safargram/saved" className={active}>
          <Bookmark size={18} /> Bucket List
        </NavLink>
        <Link to={`/profile/${me.username}`}>
          <User size={18} /> My posts
        </Link>
      </nav>

      <button
        type="button"
        className="sg-btn sg-share-rail"
        onClick={() => navigate("/safargram", { state: { compose: true } })}
      >
        <Camera size={16} style={{ verticalAlign: "-3px" }} /> Share your journey
      </button>
    </>
  );
};

export default ProfileRail;
