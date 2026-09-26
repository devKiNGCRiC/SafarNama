import mongoose from "mongoose";

export const REPORT_TYPES = ["FORUM_THREAD", "FORUM_REPLY", "GALLERY_PHOTO", "SAFARGRAM_POST"];
export const REPORT_REASONS = ["SPAM", "ABUSE", "INAPPROPRIATE", "MISINFORMATION", "OTHER"];
export const REPORT_STATUSES = ["open", "actioned", "dismissed"];

// "This content breaks the rules". A short snapshot of the content is kept so the report still
// makes sense after the content has been removed.
const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: REPORT_TYPES, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    targetOwner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    snapshot: { text: { type: String, default: "" }, image: { type: String, default: "" } },
    link: { type: String, default: "" }, // where an admin can look at it
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true, maxlength: 300, default: "" },
    status: { type: String, enum: REPORT_STATUSES, default: "open" },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    handledAt: Date,
  },
  { timestamps: true },
);

// One report per person per piece of content; reporting again is a harmless no-op.
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });
reportSchema.index({ status: 1, _id: -1 });
reportSchema.index({ targetType: 1, targetId: 1, status: 1 });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
export default Report;
