import mongoose from "mongoose";

// A record of what admins did to accounts and reports: who, what, to whom, when.
const adminActionSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    targetLabel: { type: String, default: "" }, // a readable name, kept even if the target is deleted later
  },
  { timestamps: true },
);

const AdminAction = mongoose.models.AdminAction || mongoose.model("AdminAction", adminActionSchema);
export default AdminAction;
