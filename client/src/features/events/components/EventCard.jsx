import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Users } from "lucide-react";
import { TYPE_LABELS, dateBadge, formatDateRange, spotsText } from "../utils/eventFormat";
import RegisterButton from "./RegisterButton";
import "../events.scss";

const EventCard = ({ event, onChange }) => {
  const badge = dateBadge(event.startDate);
  const cover = event.images?.[0];

  return (
    <article className={`ev-card ${event.isPast ? "past" : ""}`}>
      <Link to={`/events/${event._id}`} className="ev-cover" aria-label={event.title}>
        {cover ? <img src={cover} alt="" loading="lazy" /> : <span className="ev-cover-fallback">{TYPE_LABELS[event.type]?.[0] || "E"}</span>}
        <span className="ev-date-badge">
          <b>{badge.day}</b>
          <small>{badge.month}</small>
        </span>
        <span className="ev-type">{TYPE_LABELS[event.type] || "Event"}</span>
      </Link>

      <div className="ev-body">
        <h3><Link to={`/events/${event._id}`}>{event.title}</Link></h3>
        <p className="ev-when">{formatDateRange(event.startDate, event.endDate)}</p>
        {event.venue && (
          <p className="ev-meta"><MapPin size={14} /> {event.venue}</p>
        )}
        <p className="ev-meta"><Users size={14} /> {spotsText(event)}</p>
        <p className="ev-desc">{event.description}</p>
        <RegisterButton event={event} onChange={onChange} />
      </div>
    </article>
  );
};

export default EventCard;
