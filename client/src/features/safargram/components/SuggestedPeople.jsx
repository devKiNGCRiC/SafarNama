import React, { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { getSuggestedPeople } from "../api";
import PersonRow from "./PersonRow";
import "../safargram.scss";

// Right-hand panel: active travellers you do not follow yet.
const SuggestedPeople = () => {
  const [people, setPeople] = useState([]);

  useEffect(() => {
    let alive = true;
    getSuggestedPeople()
      .then((r) => alive && setPeople(r.data))
      .catch(() => {}); // decorative - never block the page
    return () => {
      alive = false;
    };
  }, []);

  if (people.length === 0) return null;

  return (
    <section className="sg-panel">
      <h4><Users size={16} /> Suggested travellers</h4>
      {people.map((p) => (
        <PersonRow key={p._id} person={p} />
      ))}
    </section>
  );
};

export default SuggestedPeople;
