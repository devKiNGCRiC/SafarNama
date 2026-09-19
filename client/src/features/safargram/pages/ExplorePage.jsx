import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Hash, MapPin, Search } from "lucide-react";
import { getExplore, searchSafargram } from "../api";
import PagedPostGrid from "../components/PagedPostGrid";
import PersonRow from "../components/PersonRow";
import SafarLayout from "../components/SafarLayout";
import "../safargram.scss";

const CATEGORIES = ["All", "Trekking", "Wildlife", "Culture", "Eco-stay", "Beach", "Food", "Adventure"];
const TABS = [
  ["people", "People"],
  ["hashtags", "Hashtags"],
  ["places", "Places"],
  ["posts", "Posts"],
];

// People / hashtags / places come back as one short list (no paging).
function ListResults({ type, q }) {
  const [state, setState] = useState({ loading: true, data: [], error: "" });

  useEffect(() => {
    let alive = true;
    setState({ loading: true, data: [], error: "" });
    searchSafargram(type, q)
      .then((r) => alive && setState({ loading: false, data: r.data, error: "" }))
      .catch((e) =>
        alive && setState({ loading: false, data: [], error: e.response?.data?.message || "Search failed. Please try again." }),
      );
    return () => {
      alive = false;
    };
  }, [type, q]);

  if (state.loading) return <div className="sg-state">Searching…</div>;
  if (state.error) return <div className="sg-state">{state.error}</div>;
  if (state.data.length === 0) return <div className="sg-state">No {type} found for “{q}”.</div>;

  if (type === "people") {
    return <div className="sg-panel">{state.data.map((p) => <PersonRow key={p._id} person={p} />)}</div>;
  }
  if (type === "hashtags") {
    return (
      <div className="sg-panel sg-rows">
        {state.data.map((h) => (
          <Link key={h.tag} to={`/safargram/tag/${h.tag}`}>
            <span><Hash size={16} /> {h.tag}</span>
            <small>{h.count} {h.count === 1 ? "post" : "posts"}</small>
          </Link>
        ))}
      </div>
    );
  }
  return (
    <div className="sg-panel sg-rows">
      {state.data.map((d) => (
        <Link key={d._id} to={`/safargram/destination/${d._id}`}>
          <span><MapPin size={16} /> {d.name}</span>
          <small>{d.count} {d.count === 1 ? "post" : "posts"}</small>
        </Link>
      ))}
    </div>
  );
}

const ExplorePage = () => {
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") || "").trim();
  const type = TABS.some(([id]) => id === params.get("type")) ? params.get("type") : "people";
  const [input, setInput] = useState(q);
  const [category, setCategory] = useState("All");
  const searching = q.length >= 2;

  // Put what the user typed into the URL (after a short pause) so results can be shared / go back.
  useEffect(() => {
    const timer = setTimeout(() => {
      const value = input.trim();
      if (value === q) return;
      const next = new URLSearchParams(params);
      if (value) next.set("q", value);
      else next.delete("q");
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const setType = (id) => {
    const next = new URLSearchParams(params);
    next.set("type", id);
    setParams(next, { replace: true });
  };

  return (
    <SafarLayout grid>
      <div className="sg-title">
        <Link to="/safargram">←</Link>
        <h2>Explore</h2>
      </div>

      <div className="sg-searchbox">
        <Search size={18} />
        <input
          type="search"
          placeholder="Search people, #hashtags, places or posts…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
      </div>

      {searching ? (
        <>
          <div className="sg-tabs">
            {TABS.map(([id, label]) => (
              <button key={id} className={type === id ? "active" : ""} onClick={() => setType(id)}>
                {label}
              </button>
            ))}
          </div>
          {type === "posts" ? (
            <PagedPostGrid
              fetchPage={(cursor) => searchSafargram("posts", q, cursor)}
              deps={[q]}
              emptyText={`No posts mention “${q}”.`}
            />
          ) : (
            <ListResults type={type} q={q} />
          )}
        </>
      ) : (
        <>
          <div className="sg-chips">
            {CATEGORIES.map((c) => (
              <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>
          <PagedPostGrid
            fetchPage={(cursor) => getExplore(category === "All" ? undefined : category, cursor)}
            deps={[category]}
            emptyText="Nothing here yet. Be the first to post!"
          />
        </>
      )}
    </SafarLayout>
  );
};

export default ExplorePage;
