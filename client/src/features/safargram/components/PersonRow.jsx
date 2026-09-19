import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { followUser, unfollowUser } from "../../../api/profileRequest";
import "../safargram.scss";

const nameOf = (u) => [u.firstName, u.lastName].filter(Boolean).join(" ") || u.username;

// One traveller with a Follow / Following button (used in search results and suggestions).
const PersonRow = ({ person }) => {
  const [following, setFollowing] = useState(!!person.isFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (following) await unfollowUser(person._id);
      else await followUser(person._id);
      setFollowing(!following);
    } catch (e) {
      toast.error(e?.message || "Could not update. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sg-person">
      <Link to={`/profile/${person.username}`} className="sg-person-link">
        {person.avatar ? (
          <img className="sg-avatar" src={person.avatar} alt="" />
        ) : (
          <span className="sg-avatar">{person.username?.[0]?.toUpperCase()}</span>
        )}
        <span className="sg-person-text">
          <strong>{nameOf(person)}</strong>
          <small>
            @{person.username}
            {person.postsCount ? ` · ${person.postsCount} ${person.postsCount === 1 ? "post" : "posts"}` : ""}
          </small>
        </span>
      </Link>
      <button type="button" className={`sg-btn small ${following ? "ghost" : ""}`} onClick={toggle} disabled={busy}>
        {following ? "Following" : "Follow"}
      </button>
    </div>
  );
};

export default PersonRow;
