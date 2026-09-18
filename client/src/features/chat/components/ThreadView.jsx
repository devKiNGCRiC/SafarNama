import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { ArrowLeft, MoreVertical, Users } from "lucide-react";
import {
  acceptRequest,
  blockUser,
  declineRequest,
  getConversation,
  getMessages,
  markRead,
  sendMessage,
  unblockUser,
} from "../api";
import { useChat } from "../ChatProvider";
import { dayLabel, displayName, isGrouped } from "../utils/chatText";
import ChatAvatar from "./ChatAvatar";
import GroupInfoModal from "./GroupInfoModal";
import Composer from "./Composer";
import MessageBubble from "./MessageBubble";
import "../chat.scss";

const messageOf = (e, fallback) => e?.response?.data?.message || fallback;

const ThreadView = ({ conversationId, onBack, headerExtra }) => {
  const me = useSelector((state) => state.auth.user);
  const myId = String(me?.id || me?._id || "");
  const { subscribe, emit, watchPresence, onlineIds, refreshUnread } = useChat();

  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]); // oldest -> newest
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState({}); // userId -> true
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const scroller = useRef(null);
  const bottom = useRef(null);
  const stickToBottom = useRef(true);
  const anchorHeight = useRef(null); // scrollHeight before older messages were prepended
  const typingTimers = useRef({});
  const readTimer = useRef(null);

  const markReadSoon = useCallback(() => {
    clearTimeout(readTimer.current);
    readTimer.current = setTimeout(() => {
      markRead(conversationId).then(refreshUnread).catch(() => {});
    }, 400);
  }, [conversationId, refreshUnread]);

  // ---- load
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setConv(null);
    setMessages([]);
    setTyping({});
    stickToBottom.current = true;

    Promise.all([getConversation(conversationId), getMessages(conversationId)])
      .then(([c, m]) => {
        if (!alive) return;
        setConv(c.data);
        setMessages([...m.data].reverse());
        setNextCursor(m.nextCursor);
        setLoading(false);
        markRead(conversationId).then(refreshUnread).catch(() => {});
      })
      .catch((e) => {
        if (!alive) return;
        setError(messageOf(e, "Could not load this conversation."));
        setLoading(false);
      });
    return () => {
      alive = false;
      clearTimeout(readTimer.current);
    };
  }, [conversationId, refreshUnread]);

  // ---- follow the other person's online status
  const partnerId = conv?.partner?._id;
  useEffect(() => {
    if (partnerId) watchPresence([partnerId]);
  }, [partnerId, watchPresence]);

  // ---- live events for this conversation
  useEffect(() => {
    const mine = (id) => String(id) === String(conversationId);
    const offs = [
      subscribe("message:new", ({ message }) => {
        if (!mine(message.conversation)) return;
        setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
        markReadSoon();
      }),
      subscribe("typing", ({ conversationId: id, userId, isTyping }) => {
        if (!mine(id)) return;
        clearTimeout(typingTimers.current[userId]);
        setTyping((prev) => {
          const next = { ...prev };
          if (isTyping) next[userId] = true;
          else delete next[userId];
          return next;
        });
        if (isTyping) {
          // if the "stopped typing" event is lost, do not stay stuck on "typing…"
          typingTimers.current[userId] = setTimeout(
            () =>
              setTyping((prev) => {
                const next = { ...prev };
                delete next[userId];
                return next;
              }),
            4000,
          );
        }
      }),
      subscribe("message:read", ({ conversationId: id, userId, at }) => {
        if (!mine(id)) return;
        setConv((c) =>
          c && {
            ...c,
            members: c.members.map((m) => (String(m.user._id) === String(userId) ? { ...m, lastReadAt: at } : m)),
          },
        );
      }),
      subscribe("conversation:updated", ({ conversation }) => {
        if (mine(conversation._id)) setConv(conversation);
      }),
      subscribe("conversation:removed", ({ conversationId: id }) => {
        if (mine(id)) onBack?.();
      }),
    ];
    return () => {
      offs.forEach((off) => off());
      Object.values(typingTimers.current).forEach(clearTimeout);
    };
  }, [conversationId, subscribe, markReadSoon, onBack]);

  // ---- scrolling: stay pinned to the bottom unless the reader scrolled up
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (anchorHeight.current !== null) {
      el.scrollTop += el.scrollHeight - anchorHeight.current; // keep the same message in view
      anchorHeight.current = null;
    } else if (stickToBottom.current) {
      bottom.current?.scrollIntoView();
    }
  }, [messages, typing, loading]);

  const onScroll = () => {
    const el = scroller.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await getMessages(conversationId, nextCursor);
      anchorHeight.current = scroller.current?.scrollHeight ?? null;
      setMessages((prev) => [...[...page.data].reverse(), ...prev]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      toast.error(messageOf(e, "Could not load older messages"));
    } finally {
      setLoadingOlder(false);
    }
  };

  // ---- sending (optimistic; a failed message can be retried)
  const send = useCallback(
    async ({ text, file }, retryOf) => {
      const tempId = retryOf?._id || `tmp-${Date.now()}-${Math.random()}`;
      const temp = {
        _id: tempId,
        conversation: conversationId,
        sender: { _id: myId, username: me?.username, firstName: me?.firstName, lastName: me?.lastName },
        kind: file ? "image" : "text",
        text,
        media: file ? { url: URL.createObjectURL(file) } : null,
        createdAt: new Date().toISOString(),
        pending: true,
        _file: file,
      };
      stickToBottom.current = true;
      setMessages((prev) => (retryOf ? prev.map((m) => (m._id === tempId ? temp : m)) : [...prev, temp]));
      try {
        const res = await sendMessage(conversationId, { text, file });
        setMessages((prev) => prev.map((m) => (m._id === tempId ? res.data : m)));
      } catch (e) {
        setMessages((prev) => prev.map((m) => (m._id === tempId ? { ...m, pending: false, failed: true } : m)));
        toast.error(messageOf(e, "Message not sent"));
      }
    },
    [conversationId, me, myId],
  );

  // ---- actions
  const refreshConversation = async () => setConv((await getConversation(conversationId)).data);

  const accept = async () => {
    try {
      setConv((await acceptRequest(conversationId)).data);
    } catch (e) {
      toast.error(messageOf(e, "Could not accept"));
    }
  };
  const decline = async (block) => {
    try {
      await declineRequest(conversationId, block);
      onBack?.();
    } catch (e) {
      toast.error(messageOf(e, "Could not decline"));
    }
  };
  const toggleBlock = async () => {
    setMenuOpen(false);
    try {
      if (conv.blockedByMe) await unblockUser(conv.partner._id);
      else if (window.confirm(`Block ${displayName(conv.partner)}? You will not be able to message each other.`)) {
        await blockUser(conv.partner._id);
      } else return;
      await refreshConversation();
    } catch (e) {
      toast.error(messageOf(e, "Could not update the block"));
    }
  };

  // ---- render
  if (loading) return <div className="chat-thread"><div className="chat-empty">Loading…</div></div>;
  if (error || !conv) {
    return (
      <div className="chat-thread">
        <div className="chat-empty">
          {error || "Conversation not found."}
          <div><button className="chat-link" onClick={onBack}>Back to messages</button></div>
        </div>
      </div>
    );
  }

  const isGroup = conv.type === "group";
  const title = isGroup ? conv.name : displayName(conv.partner);
  const partnerOnline = !isGroup && conv.partner && onlineIds.has(String(conv.partner._id));
  const someoneTyping = Object.keys(typing).length > 0;
  const subtitle = someoneTyping
    ? "typing…"
    : isGroup
      ? `${conv.members.length} members`
      : partnerOnline
        ? "Online"
        : "";

  const partnerMember = !isGroup ? conv.members.find((m) => String(m.user._id) !== myId) : null;
  const partnerReadAt = partnerMember ? new Date(partnerMember.lastReadAt).getTime() : 0;
  const lastMine = [...messages].reverse().find((m) => String(m.sender?._id) === myId && !m.pending && !m.failed);
  const seenId = lastMine && new Date(lastMine.createdAt).getTime() <= partnerReadAt ? lastMine._id : null;

  const disabledReason = conv.blockedByMe
    ? "You blocked this user. Unblock them from the ⋮ menu to send messages."
    : conv.blockedMe
      ? "You can't message this user."
      : conv.isRequest
        ? "Accept the request above to reply."
        : null;

  return (
    <div className="chat-thread">
      <header className="chat-thread-head">
        <button type="button" className="chat-iconbtn chat-back" aria-label="Back" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <ChatAvatar user={conv.partner} name={title} online={partnerOnline} size={40} />
        <div className="chat-thread-title">
          <strong>{title}</strong>
          <small className={someoneTyping ? "typing" : ""}>{subtitle}</small>
        </div>
        {headerExtra}
        {isGroup && (
          <button type="button" className="chat-iconbtn" aria-label="Group info" onClick={() => setShowInfo(true)}>
            <Users size={20} />
          </button>
        )}
        {!isGroup && (
          <div className="chat-menu">
            <button type="button" className="chat-iconbtn" aria-label="More" onClick={() => setMenuOpen((v) => !v)}>
              <MoreVertical size={20} />
            </button>
            {menuOpen && (
              <div className="chat-dropdown">
                <button type="button" onClick={toggleBlock}>
                  {conv.blockedByMe ? "Unblock" : "Block"} {displayName(conv.partner)}
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {conv.isRequest && (
        <div className="chat-request">
          <p><strong>{title}</strong> wants to message you. They will not know you have seen it until you accept.</p>
          <div>
            <button className="chat-btn" onClick={accept}>Accept</button>
            <button className="chat-btn ghost" onClick={() => decline(false)}>Decline</button>
            <button className="chat-btn danger" onClick={() => decline(true)}>Decline &amp; block</button>
          </div>
        </div>
      )}

      <div className="chat-messages" ref={scroller} onScroll={onScroll}>
        {nextCursor && (
          <button className="chat-link center" onClick={loadOlder} disabled={loadingOlder}>
            {loadingOlder ? "Loading…" : "Load older messages"}
          </button>
        )}
        {messages.length === 0 && <div className="chat-empty">Say hello 👋</div>}

        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
          return (
            <React.Fragment key={m._id}>
              {newDay && <div className="chat-day">{dayLabel(m.createdAt)}</div>}
              <MessageBubble
                message={m}
                mine={String(m.sender?._id) === myId}
                grouped={!newDay && isGrouped(prev, m)}
                showSender={isGroup}
                seen={m._id === seenId}
                onRetry={(failed) => send({ text: failed.text, file: failed._file }, failed)}
              />
            </React.Fragment>
          );
        })}

        {someoneTyping && <div className="chat-typing">typing…</div>}
        <div ref={bottom} />
      </div>

      <Composer
        disabledReason={disabledReason}
        onSend={(payload) => send(payload)}
        onTyping={(isTyping) => emit("typing", { conversationId, isTyping })}
      />

      {showInfo && (
        <GroupInfoModal
          conv={conv}
          myId={myId}
          onClose={() => setShowInfo(false)}
          onUpdated={setConv}
          onLeft={onBack}
        />
      )}
    </div>
  );
};

export default ThreadView;
