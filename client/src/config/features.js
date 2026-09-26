// Feature switches for the client. Booking and payment are not finished, so they stay off
// unless VITE_ENABLE_BOOKING=true is set in client/.env (the server has a matching
// ENABLE_BOOKING flag that answers 404 for those APIs while it is off).
export const BOOKING_ENABLED = import.meta.env.VITE_ENABLE_BOOKING === "true";

// Sections that exist in the code but are not finished yet stay hidden (menus, footer and
// their addresses) until their flag is "true". They will be switched on one by one as each
// is completed.
export const EVENTS_ENABLED = import.meta.env.VITE_ENABLE_EVENTS === "true";
export const ECO_GUIDES_ENABLED = import.meta.env.VITE_ENABLE_ECO_GUIDES === "true";
