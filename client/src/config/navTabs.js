// Rules for the phone tab bar (Components/BottomNav). Pure functions so they can be tested in Node.

// Screens where the bar would only be in the way: sign-in forms, and an open chat with its message box.
const HIDDEN_ON = [/^\/auth/, /^\/forgot-password/, /^\/reset-password/, /^\/chat\/./, /^\/design-showcase/];

export const showBottomNav = (pathname) => !HIDDEN_ON.some((rule) => rule.test(pathname));

// The tab a path belongs to, so the right one is highlighted (null = none of the five).
export function activeTab(pathname) {
  if (pathname === "/" || pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/destinations") || pathname.startsWith("/map")) return "explore";
  if (pathname.startsWith("/safargram")) return "safargram";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/profile") || pathname.startsWith("/me")) return "profile";
  return null;
}
