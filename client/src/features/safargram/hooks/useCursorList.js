import { useCallback, useEffect, useRef, useState } from "react";

const messageOf = (error) =>
  error?.response?.data?.message || "Something went wrong. Please try again.";

// Loads the first page whenever `deps` change and appends further pages on demand.
export default function useCursorList(fetchPage, deps = []) {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;
  const requestId = useRef(0);

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchRef.current(null);
      if (id !== requestId.current) return; // a newer request replaced this one
      setItems(page.data);
      setNextCursor(page.nextCursor);
    } catch (e) {
      if (id === requestId.current) setError(messageOf(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await fetchRef.current(nextCursor);
      setItems((prev) => [
        ...prev,
        ...page.data.filter((n) => !prev.some((p) => p._id === n._id)),
      ]);
      setNextCursor(page.nextCursor);
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  return { items, setItems, loading, loadingMore, error, hasMore: !!nextCursor, loadMore, reload };
}
