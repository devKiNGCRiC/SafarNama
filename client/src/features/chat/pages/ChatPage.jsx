import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { MessageCircle, Users } from "lucide-react";
import { searchUsers, startDirect } from "../api";
import ConversationList from "../components/ConversationList";
import NewChatModal from "../components/NewChatModal";
import NewGroupModal from "../components/NewGroupModal";
import ThreadView from "../components/ThreadView";
import "../chat.scss";

// /chat, /chat/:conversationId and /chat/with/:username share this page.
const ChatPage = () => {
  const { conversationId, username } = useParams();
  const navigate = useNavigate();
  const [showNew, setShowNew] = useState(false);
  const [showGroup, setShowGroup] = useState(false);

  // "Message" buttons link to /chat/with/<username>: find the user, open (or create) the chat.
  useEffect(() => {
    if (!username) return undefined;
    let alive = true;
    (async () => {
      try {
        const found = await searchUsers(username);
        const user = found.data.find((u) => u.username.toLowerCase() === username.toLowerCase());
        if (!user) throw new Error("not found");
        const chat = await startDirect(user._id);
        if (alive) navigate(`/chat/${chat.data._id}`, { replace: true });
      } catch (e) {
        if (!alive) return;
        toast.error(e.response?.data?.message || "Could not start that conversation");
        navigate("/chat", { replace: true });
      }
    })();
    return () => {
      alive = false;
    };
  }, [username, navigate]);

  const openConversation = useCallback((id) => navigate(`/chat/${id}`), [navigate]);
  const backToList = useCallback(() => navigate("/chat"), [navigate]);

  return (
    <div className="chat-page">
      <div className={`chat-shell ${conversationId ? "has-thread" : ""}`}>
        <aside className="chat-pane-list">
          <ConversationList
            activeId={conversationId}
            onOpen={openConversation}
            onNewChat={() => setShowNew(true)}
            extraActions={
              <button type="button" className="chat-iconbtn" aria-label="New group" onClick={() => setShowGroup(true)}>
                <Users size={20} />
              </button>
            }
          />
        </aside>

        <section className="chat-pane-thread">
          {conversationId ? (
            <ThreadView key={conversationId} conversationId={conversationId} onBack={backToList} />
          ) : (
            <div className="chat-placeholder">
              <MessageCircle size={56} />
              <h3>Your messages</h3>
              <p>{username ? "Opening your conversation…" : "Pick a conversation, or start a new one."}</p>
              {!username && (
                <button className="chat-btn" onClick={() => setShowNew(true)}>New message</button>
              )}
            </div>
          )}
        </section>
      </div>

      {showGroup && (
        <NewGroupModal
          onClose={() => setShowGroup(false)}
          onCreated={(id) => {
            setShowGroup(false);
            openConversation(id);
          }}
        />
      )}

      {showNew && (
        <NewChatModal
          onClose={() => setShowNew(false)}
          onOpened={(id) => {
            setShowNew(false);
            openConversation(id);
          }}
        />
      )}
    </div>
  );
};

export default ChatPage;
