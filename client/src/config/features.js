// Feature switches for the client. Booking and payment are not finished, so they stay off
// unless VITE_ENABLE_BOOKING=true is set in client/.env (the server has a matching
// ENABLE_BOOKING flag that answers 404 for those APIs while it is off).
export const BOOKING_ENABLED = import.meta.env.VITE_ENABLE_BOOKING === "true";

// Sections that exist in the code but are not finished yet stay hidden (menus, footer and
// their addresses) until they are switched on. They are switched on one by one as each is
// completed. Events and Eco-Guides are finished, so they are on unless their flag is "false".
export const EVENTS_ENABLED = import.meta.env.VITE_ENABLE_EVENTS !== "false";
export const ECO_GUIDES_ENABLED = import.meta.env.VITE_ENABLE_ECO_GUIDES !== "false";
