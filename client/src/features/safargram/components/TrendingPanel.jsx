import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Hash, MapPin } from "lucide-react";
import { getTrending } from "../api";
import SuggestedPeople from "./SuggestedPeople";
import "../safargram.scss";

// Right column on desktop: what travellers are posting about right now.
const TrendingPanel = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    getTrending()
      .then((r) => alive && setData(r.data))
      .catch(() => {}); // purely decorative - the feed works without it
    return () => {
      alive = false;
    };
  }, []);

  if (!data) return null;

  return (
    <>
      <section className="sg-panel">
        <h4><Hash size={16} /> Trending hashtags</h4>
        {data.hashtags.length === 0 ? (
          <p className="sg-muted">Nothing yet. Add #hashtags to your next post!</p>
        ) : (
          <div className="sg-tagchips">
            {data.hashtags.map((h) => (
              <Link key={h.tag} className="sg-tagchip" to={`/safargram/tag/${h.tag}`}>
                #{h.tag} <small>{h.count}</small>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="sg-panel">
        <h4><MapPin size={16} /> Popular destinations</h4>
        {data.destinations.length === 0 ? (
          <p className="sg-muted">Tag a destination in your next post to put it here.</p>
        ) : (
          <ul className="sg-places">
            {data.destinations.map((d) => (
              <li key={d._id}>
                <Link to={`/safargram/destination/${d._id}`}>
                  <span>{d.name}</span>
                  <small>{d.count} {d.count === 1 ? "post" : "posts"}</small>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <SuggestedPeople />
    </>
  );
};

export default TrendingPanel;
