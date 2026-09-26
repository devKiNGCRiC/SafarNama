import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Calendar, Leaf, MapPin, Share2, Users } from "lucide-react";
import { getEvent } from "../api";
import RegisterButton from "../components/RegisterButton";
import AttendeesModal from "../components/AttendeesModal";
import { TYPE_LABELS, formatDateRange, spotsText } from "../utils/eventFormat";
import "../events.scss";

const EventDetailPage = () => {
  const { id } = useParams();
  const me = useSelector((state) => state.auth.user);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [showAttendees, setShowAttendees] = useState(false);

  useEffect(() => {
    let alive = true;
    setEvent(null);
    setError("");
    getEvent(id)
      .then((r) => alive && setEvent(r.data))
      .catch((e) => alive && setError(e.response?.status === 404 ? "This event does not exist (any more)." : "Could not load the event."));
    return () => {
      alive = false;
    };
  }, [id]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch {
      /* cancelled */
    }
  };

  if (error) {
    return (
      <div className="ev-page">
        <div className="ev-wrap ev-state">
          {error} <Link to="/events">Back to events</Link>
        </div>
      </div>
    );
  }
  if (!event) return <div className="ev-page"><div className="ev-wrap ev-state">Loading…</div></div>;

  const myId = String(me?.id || me?._id || "");
  const canManage = me?.role === "admin" || (event.organizer && String(event.organizer._id) === myId);

  return (
    <div className="ev-page">
      <div className="ev-wrap">
        <p><Link to="/events">← All events</Link></p>
        <article className="ev-detail">
          <div className="ev-hero">{event.images?.[0] && <img src={event.images[0]} alt="" />}</div>
          <div className="ev-detail-body">
            <span className="ev-type-pill">{TYPE_LABELS[event.type] || "Event"}</span>
            <h1>{event.title}</h1>

            <div className="ev-facts">
              <p><Calendar size={18} /> {formatDateRange(event.startDate, event.endDate)}</p>
              {event.venue && <p><MapPin size={18} /> {event.venue}</p>}
              <p><Users size={18} /> {spotsText(event)} · {event.registeredCount} registered</p>
              {event.organizer && <p>Organised by <strong>{event.organizer.username}</strong></p>}
            </div>

            <div className="ev-description">{event.description}</div>
            {event.impact && (
              <div className="ev-impact"><Leaf size={16} style={{ verticalAlign: "-2px" }} /> <strong>Environmental impact:</strong> {event.impact}</div>
            )}

            <div className="ev-actions">
              <RegisterButton event={event} onChange={setEvent} />
              <button type="button" className="ev-btn ghost" onClick={share}>
                <Share2 size={16} style={{ verticalAlign: "-3px" }} /> Share
              </button>
              {canManage && (
                <button type="button" className="ev-btn ghost" onClick={() => setShowAttendees(true)}>
                  Attendees ({event.registeredCount})
                </button>
              )}
            </div>
          </div>
        </article>
      </div>
      {showAttendees && <AttendeesModal event={event} onClose={() => setShowAttendees(false)} />}
    </div>
  );
};

export default EventDetailPage;
