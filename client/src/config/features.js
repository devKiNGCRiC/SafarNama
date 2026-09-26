// Feature switches for the client. Booking and payment are not finished, so they stay off
// unless VITE_ENABLE_BOOKING=true is set in client/.env (the server has a matching
// ENABLE_BOOKING flag that answers 404 for those APIs while it is off).
export const BOOKING_ENABLED = import.meta.env.VITE_ENABLE_BOOKING === "true";
