// What admins see and which buttons they get. Pure functions (tested in Node); the server
// enforces every rule again.

export function statusOf(user) {
  if (user.accountStatus === "suspended") return { id: "suspended", label: "Suspended" };
  if (user.isActive === false) return { id: "deactivated", label: "Deactivated" };
  return { id: "active", label: "Active" };
}

// The actions available for a row of the user table, for the admin `meId`.
// `confirm` is the sentence shown before doing it.
export function userActionsFor(user, meId) {
  if (String(user._id) === String(meId)) return []; // never your own account
  const name = user.username;
  const status = statusOf(user);
  const actions = [];

  if (user.role === "admin") {
    actions.push({ id: "remove-admin", label: "Remove admin", confirm: `Remove admin rights from ${name}?` });
    return actions; // admins must be demoted before any other action
  }
  if (status.id === "suspended") {
    actions.push({ id: "unsuspend", label: "Unsuspend", confirm: `Let ${name} use their account again?` });
  } else if (status.id === "deactivated") {
    actions.push({ id: "reactivate", label: "Reactivate", confirm: `Reopen the account of ${name}?` });
  } else {
    actions.push({ id: "suspend", label: "Suspend", danger: true, confirm: `Suspend ${name}? They will be signed out and unable to log in.` });
    actions.push({ id: "deactivate", label: "Deactivate", danger: true, confirm: `Close the account of ${name}? They will not be able to log in.` });
  }
  actions.push({ id: "make-admin", label: "Make admin", confirm: `Give ${name} full admin rights?` });
  return actions;
}

const AUDIT_TEXT = {
  suspend: "suspended",
  unsuspend: "unsuspended",
  deactivate: "deactivated the account of",
  reactivate: "reactivated the account of",
  "make-admin": "made an admin:",
  "remove-admin": "removed admin rights from",
  "report-actioned": "acted on a report about",
  "report-dismissed": "dismissed a report about",
};

// "asha suspended ben_treks"
export function auditSentence(entry) {
  const who = entry.admin?.username || "An admin";
  const what = AUDIT_TEXT[entry.action] || entry.action;
  return [who, what, entry.targetLabel && `“${entry.targetLabel}”`].filter(Boolean).join(" ");
}

// How the deleting call for reported content is chosen.
export const REMOVAL_TARGETS = ["FORUM_THREAD", "FORUM_REPLY", "GALLERY_PHOTO", "SAFARGRAM_POST"];

export const starText = (rating) => {
  const n = Math.max(0, Math.min(5, Number(rating) || 0));
  return n ? `${"★".repeat(n)}${"☆".repeat(5 - n)}` : "";
};
