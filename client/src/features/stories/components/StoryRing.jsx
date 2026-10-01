import React, { useState } from "react";
import { useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { useStories } from "../StoriesProvider";
import CreateStoryModal from "./CreateStoryModal";
import StoryViewer from "./StoryViewer";
import { openAt } from "../utils/storyFormat";
import "../stories.scss";

// The row of circles at the top of SafarGram: "Your story" (with an add button) plus everyone
// you follow who has posted one in the last 24 hours, unseen people first.
const StoryRing = () => {
  const me = useSelector((state) => state.auth.user);
  const myId = String(me?.id || me?._id || "");
  const { groups, loading, markViewed, addMine, removeMine } = useStories();
  const [creating, setCreating] = useState(false);
  const [position, setPosition] = useState(null);

  if (loading && groups.length === 0) return null;

  const mine = groups.find((g) => g.author._id === myId);
  const others = groups.filter((g) => g.author._id !== myId);

  const open = (authorId) => setPosition(openAt(groups, authorId));
  const onCreated = (story) => {
    addMine(story);
    setCreating(false);
  };
  const onDeleted = (storyId) => {
    removeMine(storyId);
    setPosition(null);
  };

  return (
    <div className="st-ring">
      <button type="button" className="st-ring-item you" onClick={() => (mine ? open(myId) : setCreating(true))}>
        <span className={`st-ring-avatar ${mine ? (mine.hasUnseen ? "unseen" : "seen") : "empty"}`}>
          {me?.avatar ? <img src={me.avatar} alt="" /> : <b>{(me?.username || "?")[0]?.toUpperCase()}</b>}
          {!mine && <i className="st-ring-add" aria-hidden="true"><Plus size={13} /></i>}
        </span>
        <small>Your story</small>
      </button>
      {mine && (
        <button type="button" className="st-ring-add-more" onClick={() => setCreating(true)} aria-label="Add to your story">
          <Plus size={16} />
        </button>
      )}

      {others.map((g) => (
        <button key={g.author._id} type="button" className="st-ring-item" onClick={() => open(g.author._id)}>
          <span className={`st-ring-avatar ${g.hasUnseen ? "unseen" : "seen"}`}>
            {g.author.avatar ? <img src={g.author.avatar} alt="" /> : <b>{g.author.username[0]?.toUpperCase()}</b>}
          </span>
          <small>{g.author.username}</small>
        </button>
      ))}

      {creating && <CreateStoryModal onClose={() => setCreating(false)} onCreated={onCreated} />}
      {position && (
        <StoryViewer
          groups={groups}
          position={position}
          onMove={setPosition}
          onClose={() => setPosition(null)}
          onViewed={markViewed}
          onDeleted={onDeleted}
        />
      )}
    </div>
  );
};

export default StoryRing;
