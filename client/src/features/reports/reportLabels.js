// Shared by the "Report" dialog and the admin review queue.
export const REPORT_REASONS = [
  { id: "SPAM", label: "Spam or advertising" },
  { id: "ABUSE", label: "Harassment or abuse" },
  { id: "INAPPROPRIATE", label: "Inappropriate content" },
  { id: "MISINFORMATION", label: "False or misleading information" },
  { id: "OTHER", label: "Something else" },
];

export const REPORT_TYPE_LABELS = {
  FORUM_THREAD: "Forum thread",
  FORUM_REPLY: "Forum reply",
  GALLERY_PHOTO: "Gallery photo",
  SAFARGRAM_POST: "SafarGram post",
};

export const reasonLabel = (id) => REPORT_REASONS.find((r) => r.id === id)?.label || "Other";
export const typeLabel = (type) => REPORT_TYPE_LABELS[type] || "Content";
