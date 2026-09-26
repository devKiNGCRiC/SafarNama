import { useEffect, useState } from "react";
import { http } from "../../config/api";

// Real totals for the home page ({ destinations, tours, blogs, travellers }).
// `null` while loading or if the request fails - callers show a dash instead of a made-up number.
export default function usePublicStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    http
      .get("/api/v1/public-stats")
      .then((r) => alive && setStats(r.data.data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return stats;
}
