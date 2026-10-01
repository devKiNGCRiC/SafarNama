import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getStoryFeed } from "./api";

const StoriesContext = createContext(null);
const FALLBACK = { groups: [], loading: false, reload: () => {}, markViewed: () => {}, addMine: () => {}, removeMine: () => {} };

// Loads the story feed once (so the ring on SafarGram and the viewer agree), and lets the
// viewer mark stories as seen or add/remove the person's own without a full reload.
export function StoriesProvider({ children }) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    getStoryFeed()
      .then((r) => setGroups(r.data))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) reload();
    else setGroups([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const markViewed = useCallback((storyId) => {
    setGroups((list) =>
      list.map((g) => ({
        ...g,
        stories: g.stories.map((s) => (s._id === storyId ? { ...s, viewedByMe: true, viewerCount: s.viewedByMe ? s.viewerCount : s.viewerCount + 1 } : s)),
        hasUnseen: g.stories.some((s) => s._id === storyId ? false : !s.viewedByMe),
      })),
    );
  }, []);

  const addMine = useCallback((story) => {
    setGroups((list) => {
      const mine = list.find((g) => g.author._id === story.author._id);
      if (mine) return list.map((g) => (g === mine ? { ...g, stories: [...g.stories, story] } : g));
      return [{ author: story.author, stories: [story], hasUnseen: false }, ...list];
    });
  }, []);

  const removeMine = useCallback((storyId) => {
    setGroups((list) => list.map((g) => ({ ...g, stories: g.stories.filter((s) => s._id !== storyId) })).filter((g) => g.stories.length));
  }, []);

  const value = useMemo(() => ({ groups, loading, reload, markViewed, addMine, removeMine }), [groups, loading, reload, markViewed, addMine, removeMine]);
  return <StoriesContext.Provider value={value}>{children}</StoriesContext.Provider>;
}

export const useStories = () => useContext(StoriesContext) || FALLBACK;
