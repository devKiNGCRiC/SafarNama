import axios from "axios";
import toast from "react-hot-toast";
import { http } from "./api";
import { shouldExpireSession } from "./sessionRules";
import { logout } from "../store/reducers/authSlice";

// The login token lasts 7 days. When the server finally says 401, log the user out cleanly
// (protected pages then send them to the sign-in page) instead of leaving a site that looks
// logged in but where every action silently fails.
export function installSessionExpiry(store) {
  let recentlyAnnounced = false;

  const onError = (error) => {
    if (shouldExpireSession(error, store.getState().auth)) {
      store.dispatch(logout());
      if (!recentlyAnnounced) {
        recentlyAnnounced = true;
        toast.error("Your session has expired. Please log in again.");
        setTimeout(() => {
          recentlyAnnounced = false;
        }, 3000);
      }
    }
    return Promise.reject(error);
  };

  axios.interceptors.response.use((response) => response, onError);
  http.interceptors.response.use((response) => response, onError);
}
