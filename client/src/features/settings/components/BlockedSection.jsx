import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getBlocks, unblockUser } from "../../chat/api";
import ChatAvatar from "../../chat/components/ChatAvatar";
import { displayName } from "../../chat/utils/chatText";

// People you blocked in chat. They cannot message you (or send you notifications) until unblocked.
const BlockedSection = () => {
  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let alive = true;
    getBlocks()
      .then((r) => alive && setPeople(r.data))
      .catch(() => alive && setError("Could not load your blocked list."));
    return () => {
      alive = false;
    };
  }, []);

  const unblock = async (person) => {
    setBusyId(person._id);
    try {
      await unblockUser(person._id);
      setPeople((list) => list.filter((p) => p._id !== person._id));
      toast.success(`${displayName(person)} was unblocked`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not unblock");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="st-card" id="blocked">
      <h2>Blocked people</h2>
      <p className="st-sub">Blocked people cannot message you or send you notifications.</p>
      {error && <p className="st-error">{error}</p>}
      {!people && !error && <p className="st-sub">Loading…</p>}
      {people?.length === 0 && <p className="st-sub">You have not blocked anyone.</p>}
      {people?.map((p) => (
        <div key={p._id} className="st-row">
          <span className="st-person">
            <ChatAvatar user={p} size={38} />
            <span>
              <strong>{displayName(p)}</strong>
              <small>@{p.username}</small>
            </span>
          </span>
          <button type="button" className="st-btn ghost" onClick={() => unblock(p)} disabled={busyId === p._id}>
            {busyId === p._id ? "…" : "Unblock"}
          </button>
        </div>
      ))}
    </section>
  );
};

export default BlockedSection;
