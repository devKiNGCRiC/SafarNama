import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import Navbar from "../../../Components/Navbar/Navbar";
import Sidebar from "../../../Components/Sidebar/Sidebar";
import Footer from "../../../Components/Footer/Footer";
import PlanForm from "../components/PlanForm";
import TripEditor from "../components/TripEditor";
import SavedTrips from "../components/SavedTrips";
import { generatePlan, saveItinerary, updateItinerary } from "../api";
import { itineraryToStops, planToStops, suggestTitle, tripError, tripToPayload } from "../utils/tripPlan";
import "../itinerary.scss";

const DRAFT_KEY = "safarnama:itinerary-draft";

// A trip that was being built when the person had to log in to save it, so it is not lost.
const loadDraft = () => {
  try {
    const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY));
    return draft && Array.isArray(draft.stops) && draft.stops.length ? draft : null;
  } catch {
    return null;
  }
};
const storeDraft = (draft) => {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    /* private mode etc.: the draft is just not kept */
  }
};

// Plan my trip (the planner) + build / edit by hand + your saved trips.
const ItineraryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const [stops, setStops] = useState([]);
  const [title, setTitle] = useState("");
  const [plan, setPlan] = useState(null); // the planner's last answer (summary + warnings)
  const [generated, setGenerated] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [planning, setPlanning] = useState(false);
  const [planError, setPlanError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedVersion, setSavedVersion] = useState(0);
  const editorRef = useRef(null);

  // pick up a draft saved just before logging in
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setStops(draft.stops);
    setTitle(draft.title || "");
    setGenerated(Boolean(draft.generated));
    setPlan(draft.plan || null);
    storeDraft(null);
    toast.success("Welcome back! Your trip is still here.");
  }, []);

  const scrollToEditor = () => setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);

  const generate = async (form) => {
    setPlanning(true);
    setPlanError("");
    try {
      const res = await generatePlan(form);
      const nextStops = planToStops(res.data);
      setStops(nextStops);
      setPlan(res.data);
      setGenerated(true);
      setEditingId(null);
      setTitle(suggestTitle(nextStops));
      scrollToEditor();
    } catch (e) {
      setPlanError(e.response?.data?.message || "Could not plan your trip. Please try again.");
    } finally {
      setPlanning(false);
    }
  };

  const clear = () => {
    if (stops.length && !window.confirm("Clear this trip and start over?")) return;
    setStops([]);
    setTitle("");
    setPlan(null);
    setGenerated(false);
    setEditingId(null);
  };

  const edit = (trip) => {
    setStops(itineraryToStops(trip));
    setTitle(trip.title);
    setPlan(null);
    setGenerated(Boolean(trip.generated));
    setEditingId(trip._id);
    scrollToEditor();
  };

  const save = async () => {
    const problem = tripError({ title, stops });
    if (problem) return toast.error(problem);
    if (!isAuthenticated) {
      storeDraft({ title, stops, generated, plan });
      toast("Please log in to save your trip. We will keep it for you.", { icon: "🔐" });
      navigate("/auth", { state: { from: location } });
      return;
    }

    setSaving(true);
    try {
      const payload = tripToPayload({ title, stops, generated });
      if (editingId) await updateItinerary(editingId, payload);
      else await saveItinerary(payload);
      toast.success(editingId ? "Itinerary updated" : "Itinerary saved");
      setSavedVersion((v) => v + 1);
      setStops([]);
      setTitle("");
      setPlan(null);
      setGenerated(false);
      setEditingId(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not save the itinerary. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="it-page">
        <div className="it-wrap">
          <header className="it-head">
            <h1>Plan your yatra</h1>
            <p>Get a ready-made route in seconds, or build your own. Change anything, then save it.</p>
          </header>

          <div className="it-layout">
            <div className="it-left">
              <PlanForm onGenerate={generate} busy={planning} />
              {planError && <p className="it-error" role="alert">{planError}</p>}
            </div>

            <div className="it-right" ref={editorRef}>
              <TripEditor
                title={title}
                setTitle={setTitle}
                stops={stops}
                setStops={setStops}
                plan={plan}
                editing={Boolean(editingId)}
                saving={saving}
                onSave={save}
                onClear={clear}
              />
            </div>
          </div>

          <SavedTrips reloadKey={savedVersion} onEdit={edit} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ItineraryPage;
