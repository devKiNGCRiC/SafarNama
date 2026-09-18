import { useEffect } from "react";
import useCursorList from "../../safargram/hooks/useCursorList";
import { getInbox, getRequests } from "../api";
import { useChat } from "../ChatProvider";

// The list behind the "Chats" or "Requests" tab, kept live from socket events.
export default function useConversations(tab) {
  const { subscribe } = useChat();
  const list = useCursorList(
    async (cursor) => (tab === "requests" ? { ...(await getRequests()), nextCursor: null } : getInbox(cursor)),
    [tab],
  );
  const { setItems } = list;

  useEffect(() => {
    const wantsRequests = tab === "requests";

    // Put `conversation` at the top if it belongs to this tab, otherwise drop it.
    const upsert = (conversation) => {
      if (!conversation) return;
      setItems((prev) => {
        const rest = prev.filter((c) => c._id !== conversation._id);
        if (Boolean(conversation.isRequest) !== wantsRequests) return rest;
        return [conversation, ...rest];
      });
    };
    const remove = ({ conversationId }) => setItems((prev) => prev.filter((c) => c._id !== conversationId));

    const offs = [
      subscribe("message:new", ({ conversation }) => upsert(conversation)),
      subscribe("conversation:updated", ({ conversation }) => upsert(conversation)),
      subscribe("conversation:removed", remove),
    ];
    return () => offs.forEach((off) => off());
  }, [tab, subscribe, setItems]);

  return list;
}
