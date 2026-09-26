import UserModel from "../Models/userModel.js";
import Report, { REPORT_STATUSES } from "../Models/reportModel.js";
import AdminAction from "../Models/adminActionModel.js";
import SafarPost from "../Models/safargramPostModel.js";
import Blog from "../Models/blogModel.js";
import EcoGuide from "../Models/ecoGuideModel.js";
import Event from "../Models/eventModel.js";
import ForumThread from "../Models/forumThreadModel.js";
import GalleryPhoto from "../Models/galleryPhotoModel.js";
import Destination from "../Models/destinationModel.js";
import Tour from "../Models/TourModel.js";
import Subscriber from "../Models/subscriberModel.js";
import Contact from "../Models/Contact.js";
import Feedback from "../Models/Feedback.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId, cursorFilter, parsePaging, toPage } from "../utils/cursor.js";
import { escapeRegex } from "../utils/regex.js";
import { logSecurityEvent } from "../utils/security.js";

const person = (u) => (u ? { _id: u._id, username: u.username, avatar: u.avatar || "" } : null);
const WEEK = 7 * 24 * 60 * 60 * 1000;

const record = (admin, action, target, targetLabel = "") =>
  AdminAction.create({ admin: admin._id, action, targetUser: target?._id, targetLabel });

// One row of the user table. Only fields an admin needs; never passwords or tokens.
export function serializeUser(u) {
  return {
    _id: u._id,
    username: u.username,
    email: u.email,
    name: [u.firstName, u.lastName].filter(Boolean).join(" "),
    avatar: u.avatar || "",
    role: u.role,
    accountStatus: u.accountStatus,
    isActive: u.active !== false,
    isEmailVerified: Boolean(u.isEmailVerified),
    createdAt: u.createdAt,
    lastLogin: u.lastLogin || null,
  };
}

const USER_STATUSES = ["active", "suspended", "deactivated"];

// What each admin action does to an account, and when it is not allowed.
const USER_ACTIONS = {
  suspend: { needsUser: true, update: { accountStatus: "suspended" }, guard: (t) => t.role === "admin" && "Remove this person's admin rights before suspending them" },
  unsuspend: { update: { accountStatus: "active" } },
  deactivate: { needsUser: true, update: { active: false }, guard: (t) => t.role === "admin" && "Remove this person's admin rights before closing their account" },
  reactivate: { update: { active: true } },
  "make-admin": { update: { role: "admin" }, guard: (t) => t.role === "admin" && "That person is already an admin" },
  "remove-admin": { update: { role: "user" }, guard: (t) => t.role !== "admin" && "That person is not an admin" },
};

export function makeAdminController() {
  const overview = catchAsync(async (req, res) => {
    const weekAgo = new Date(Date.now() - WEEK);
    const [
      users, newUsersThisWeek, verifiedUsers, suspendedUsers, posts, blogs, guides, events, forumThreads,
      galleryPhotos, destinations, tours, subscribers, contactMessages, feedbackMessages, openReports, recentUsers,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ createdAt: { $gte: weekAgo } }),
      UserModel.countDocuments({ isEmailVerified: true }),
      UserModel.countDocuments({ accountStatus: "suspended" }),
      SafarPost.countDocuments(),
      Blog.countDocuments(),
      EcoGuide.countDocuments(),
      Event.countDocuments(),
      ForumThread.countDocuments(),
      GalleryPhoto.countDocuments(),
      Destination.countDocuments(),
      Tour.countDocuments(),
      Subscriber.countDocuments(),
      Contact.countDocuments(),
      Feedback.countDocuments(),
      Report.countDocuments({ status: "open" }),
      UserModel.find().sort({ _id: -1 }).limit(5).select("username email createdAt isEmailVerified").lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          users, newUsersThisWeek, verifiedUsers, suspendedUsers, posts, blogs, guides, events, forumThreads,
          galleryPhotos, destinations, tours, subscribers, messages: contactMessages + feedbackMessages, openReports,
        },
        recentUsers: recentUsers.map((u) => ({
          _id: u._id, username: u.username, email: u.email, isEmailVerified: Boolean(u.isEmailVerified), createdAt: u.createdAt,
        })),
      },
    });
  });

  const listUsers = catchAsync(async (req, res) => {
    const { search, status, role } = req.query;
    if (status && !USER_STATUSES.includes(status)) throw new AppError("Unknown status", 400);
    if (role && !["user", "admin"].includes(role)) throw new AppError("Unknown role", 400);
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 20, max: 50 });

    const filter = { ...cursorFilter(cursor) };
    if (role) filter.role = role;
    if (status === "suspended") filter.accountStatus = "suspended";
    if (status === "deactivated") filter.active = false;
    if (status === "active") Object.assign(filter, { accountStatus: { $ne: "suspended" }, active: { $ne: false } });
    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ username: rx }, { email: rx }, { firstName: rx }, { lastName: rx }];
    }

    const rows = await UserModel.find(filter).select("+active").sort({ _id: -1 }).limit(limit + 1);
    const { page, nextCursor } = toPage(rows, limit);
    res.status(200).json({ success: true, data: page.map(serializeUser), nextCursor });
  });

  const userAction = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.userId, "user id");
    const rule = USER_ACTIONS[req.body?.action];
    if (!rule) throw new AppError(`Unknown action. Use one of: ${Object.keys(USER_ACTIONS).join(", ")}`, 400);
    if (id === String(req.user._id)) throw new AppError("You cannot do this to your own account", 400);

    const target = await UserModel.findById(id).select("+active");
    if (!target) throw new AppError("User not found", 404);
    const problem = rule.guard?.(target);
    if (problem) throw new AppError(problem, 400);

    Object.assign(target, rule.update);
    await target.save({ validateBeforeSave: false }); // never blocked by old records with missing fields
    await record(req.user, req.body.action, target, target.username);
    logSecurityEvent("ADMIN_USER_ACTION", { admin: req.user._id, action: req.body.action, target: target._id });
    res.status(200).json({ success: true, data: serializeUser(target) });
  });

  const listReports = catchAsync(async (req, res) => {
    const status = req.query.status ?? "open";
    if (!REPORT_STATUSES.includes(status)) throw new AppError("Unknown status", 400);
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 20, max: 50 });

    const rows = await Report.find({ status, ...cursorFilter(cursor) })
      .sort({ _id: -1 })
      .limit(limit + 1)
      .populate("reporter", "username avatar")
      .populate("targetOwner", "username avatar");
    const { page, nextCursor } = toPage(rows, limit);

    // how many people flagged the same content (only meaningful for the open queue)
    const data = await Promise.all(
      page.map(async (r) => ({
        _id: r._id,
        targetType: r.targetType,
        targetId: r.targetId,
        link: r.link,
        snapshot: r.snapshot,
        reason: r.reason,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt,
        handledAt: r.handledAt || null,
        reporter: person(r.reporter),
        targetOwner: person(r.targetOwner),
        openForTarget: await Report.countDocuments({ targetType: r.targetType, targetId: r.targetId, status: "open" }),
      })),
    );
    res.status(200).json({ success: true, data, nextCursor });
  });

  // Handling one report handles every open report on the same content.
  const resolveReport = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.reportId, "report id");
    const status = req.body?.status;
    if (!["actioned", "dismissed"].includes(status)) throw new AppError("Status must be actioned or dismissed", 400);

    const report = await Report.findById(id);
    if (!report) throw new AppError("Report not found", 404);
    if (report.status !== "open") throw new AppError("This report was already handled", 400);

    await Report.updateMany(
      { targetType: report.targetType, targetId: report.targetId, status: "open" },
      { $set: { status, handledBy: req.user._id, handledAt: new Date() } },
    );
    await record(req.user, `report-${status}`, report.targetOwner ? { _id: report.targetOwner } : null, report.snapshot?.text?.slice(0, 80));
    res.status(200).json({ success: true, data: { status } });
  });

  // Contact-form messages and feedback (newest first). The date comes from the record's id.
  const listMessages = catchAsync(async (req, res) => {
    const type = req.query.type ?? "contact";
    if (!["contact", "feedback"].includes(type)) throw new AppError("type must be contact or feedback", 400);
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 20, max: 50 });

    const Model = type === "contact" ? Contact : Feedback;
    const rows = await Model.find(cursorFilter(cursor)).sort({ _id: -1 }).limit(limit + 1).lean();
    const { page, nextCursor } = toPage(rows, limit);
    const data = page.map((m) =>
      type === "contact"
        ? {
            _id: m._id,
            name: [m.firstName, m.lastName].filter(Boolean).join(" "),
            email: m.email,
            phone: m.phone,
            message: m.message,
            createdAt: m._id.getTimestamp(),
          }
        : { _id: m._id, message: m.feedback, rating: m.rating ?? null, createdAt: m._id.getTimestamp() },
    );
    res.status(200).json({ success: true, data, nextCursor });
  });

  const listAudit = catchAsync(async (req, res) => {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "30", 10) || 30, 1), 100);
    const rows = await AdminAction.find().sort({ _id: -1 }).limit(limit).populate("admin", "username");
    res.status(200).json({
      success: true,
      data: rows.map((r) => ({
        _id: r._id,
        action: r.action,
        admin: person(r.admin),
        targetLabel: r.targetLabel,
        createdAt: r.createdAt,
      })),
    });
  });

  return { overview, listUsers, userAction, listReports, resolveReport, listMessages, listAudit };
}
