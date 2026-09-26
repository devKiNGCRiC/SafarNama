import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// [path prefix, page title] - the longest matching prefix wins.
const TITLES = [
  ["/home", "Home"],
  ["/destinations", "Destinations"],
  ["/tours", "Tours"],
  ["/map", "Eco map"],
  ["/itinerary", "Itinerary builder"],
  ["/blogs", "Travel blog"],
  ["/blog/", "Travel blog"],
  ["/blog-details", "Edit blog"],
  ["/create-blog", "Write a blog"],
  ["/myblog", "My blogs"],
  ["/safargram/explore", "Explore · SafarGram"],
  ["/safargram/saved", "Bucket list · SafarGram"],
  ["/safargram", "SafarGram"],
  ["/chat", "Messages"],
  ["/notifications", "Notifications"],
  ["/events", "Events"],
  ["/admin/events", "Manage events"],
  ["/profile", "Profile"],
  ["/auth", "Sign in"],
  ["/forgot-password", "Forgot password"],
  ["/reset-password", "Reset password"],
  ["/aboutus", "About us"],
  ["/contact-Us", "Contact us"],
  ["/FAQ", "FAQ"],
  ["/feedback", "Feedback"],
].sort((a, b) => b[0].length - a[0].length);

const titleFor = (pathname) => {
  const hit = TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(prefix));
  return hit ? `${hit[1]} · SafarNama` : "SafarNama";
};

// Runs on every navigation: start each page at the top and give it a proper browser-tab title.
const RouteEffects = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => {
    document.title = titleFor(pathname);
  }, [pathname]);

  return null;
};

export default RouteEffects;
