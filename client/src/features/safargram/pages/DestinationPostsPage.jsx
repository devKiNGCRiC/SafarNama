import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { getDestination, getDestinationPosts } from "../api";
import PagedPostGrid from "../components/PagedPostGrid";
import "../safargram.scss";

const DestinationPostsPage = () => {
  const { id } = useParams();
  const [name, setName] = useState("");

  useEffect(() => {
    let alive = true;
    setName("");
    getDestination(id)
      .then((d) => alive && setName(d?.name || ""))
      .catch(() => {}); // the title is cosmetic; the grid still works
    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <div className="sg-page">
      <div className="sg-wide">
        <div className="sg-title">
          <Link to="/safargram">←</Link>
          <h2><MapPin size={20} /> {name || "Destination"}</h2>
          <Link to={`/destinations/${id}`}>View destination</Link>
        </div>
        <PagedPostGrid
          fetchPage={(cursor) => getDestinationPosts(id, cursor)}
          deps={[id]}
          emptyText="No traveller posts here yet. Be the first!"
        />
      </div>
    </div>
  );
};

export default DestinationPostsPage;
