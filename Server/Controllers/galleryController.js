import UserModel from "../Models/userModel.js";
import GalleryPhoto from "../Models/galleryPhotoModel.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/AppError.js";
import { assertObjectId, cursorFilter, parsePaging, toPage } from "../utils/cursor.js";
import { escapeRegex } from "../utils/regex.js";
import { removeTempFiles } from "../Middleware/safargramUpload.js";

export const MAX_PHOTOS_PER_PERSON = 300;
export const MAX_COMMENTS = 200;

const person = (u) => (u ? { _id: u._id, username: u.username, avatar: u.avatar || "" } : null);
const likedBy = (p, viewerId) => (viewerId ? (p.likes || []).some((id) => String(id) === String(viewerId)) : false);

// Storage details (publicId) never leave the server.
export function serializePhoto(doc, viewerId) {
  const p = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    _id: p._id,
    url: p.url,
    width: p.width || null,
    height: p.height || null,
    caption: p.caption || "",
    location: p.location || "",
    owner: person(p.owner),
    likeCount: (p.likes || []).length,
    commentCount: (p.comments || []).length,
    likedByMe: likedBy(p, viewerId),
    createdAt: p.createdAt,
  };
}

export const serializeComment = (c) => ({ _id: c._id, content: c.content, createdAt: c.createdAt, user: person(c.user) });

export function serializePhotoDetail(doc, viewerId) {
  const p = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return { ...serializePhoto(p, viewerId), comments: (p.comments || []).map(serializeComment) };
}

const withOwner = (query) => query.populate("owner", "username avatar");
const withPeople = (query) => withOwner(query).populate("comments.user", "username avatar");

// Caption and place are optional text; returns { data, errors } for the fields that were sent.
function parseTextFields(body = {}) {
  const data = {};
  const errors = [];
  for (const [key, max, label] of [["caption", 300, "Caption"], ["location", 80, "Location"]]) {
    if (body[key] === undefined) continue;
    const value = typeof body[key] === "string" ? body[key].trim() : "";
    if (value.length > max) errors.push(`${label} can be at most ${max} characters`);
    else data[key] = value;
  }
  return { data, errors };
}

async function loadPhoto(rawId) {
  const id = assertObjectId(rawId, "photo id");
  const photo = await GalleryPhoto.findById(id);
  if (!photo) throw new AppError("Photo not found", 404);
  return photo;
}

export function makeGalleryController({ media }) {
  const listPhotos = catchAsync(async (req, res) => {
    const { user, search } = req.query;
    const { limit, cursor } = parsePaging(req.query, { defaultLimit: 24, max: 48 });

    const filter = { ...cursorFilter(cursor) };
    if (typeof user === "string" && user.trim()) {
      const owner = await UserModel.findOne({ username: user.trim() }).select("_id").lean();
      if (!owner) return res.status(200).json({ success: true, data: [], nextCursor: null });
      filter.owner = owner._id;
    }
    if (typeof search === "string" && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ caption: rx }, { location: rx }];
    }

    const rows = await withOwner(GalleryPhoto.find(filter).sort({ _id: -1 }).limit(limit + 1));
    const { page, nextCursor } = toPage(rows, limit);
    res.status(200).json({ success: true, data: page.map((p) => serializePhoto(p, req.user?._id)), nextCursor });
  });

  const getPhoto = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "photo id");
    const photo = await withPeople(GalleryPhoto.findById(id));
    if (!photo) throw new AppError("Photo not found", 404);
    res.status(200).json({ success: true, data: serializePhotoDetail(photo, req.user?._id) });
  });

  const uploadPhoto = catchAsync(async (req, res) => {
    try {
      if (!req.file) throw new AppError("Please choose a photo to upload", 400);
      const { data, errors } = parseTextFields(req.body);
      if (errors.length) throw new AppError(errors[0], 400);
      if ((await GalleryPhoto.countDocuments({ owner: req.user._id })) >= MAX_PHOTOS_PER_PERSON) {
        throw new AppError(`You can keep up to ${MAX_PHOTOS_PER_PERSON} photos. Delete some to add more.`, 400);
      }

      let uploaded;
      try {
        uploaded = await media.upload(req.file);
      } catch (error) {
        throw error instanceof AppError ? error : new AppError("Could not upload the photo. Please try again.", 502);
      }

      let photo;
      try {
        photo = await GalleryPhoto.create({
          ...data,
          owner: req.user._id,
          url: uploaded.url,
          publicId: uploaded.publicId,
          width: uploaded.width,
          height: uploaded.height,
        });
      } catch (error) {
        await media.remove([uploaded]); // do not leave an orphaned file behind
        throw error;
      }
      const populated = await withOwner(GalleryPhoto.findById(photo._id));
      res.status(201).json({ success: true, message: "Photo added", data: serializePhoto(populated, req.user._id) });
    } finally {
      if (req.file) await removeTempFiles([req.file]);
    }
  });

  const updatePhoto = catchAsync(async (req, res) => {
    const photo = await loadPhoto(req.params.id);
    if (String(photo.owner) !== String(req.user._id)) throw new AppError("Not authorized to edit this photo", 403);
    const { data, errors } = parseTextFields(req.body);
    if (errors.length) throw new AppError(errors[0], 400);

    Object.assign(photo, data); // only caption / location can ever change
    await photo.save();
    const populated = await withOwner(GalleryPhoto.findById(photo._id));
    res.status(200).json({ success: true, data: serializePhoto(populated, req.user._id) });
  });

  const deletePhoto = catchAsync(async (req, res) => {
    const photo = await loadPhoto(req.params.id);
    if (req.user.role !== "admin" && String(photo.owner) !== String(req.user._id)) {
      throw new AppError("Not authorized to delete this photo", 403);
    }
    await photo.deleteOne();
    await media.remove([{ type: "image", publicId: photo.publicId }]);
    res.status(200).json({ success: true, message: "Photo deleted" });
  });

  // $addToSet / $pull make liking idempotent and safe when many people like at once.
  async function setLike(req, res, liking) {
    const id = assertObjectId(req.params.id, "photo id");
    const photo = await GalleryPhoto.findByIdAndUpdate(
      id,
      liking ? { $addToSet: { likes: req.user._id } } : { $pull: { likes: req.user._id } },
      { new: true, projection: { likes: 1 } },
    );
    if (!photo) throw new AppError("Photo not found", 404);
    res.status(200).json({ success: true, data: { likeCount: photo.likes.length, likedByMe: liking } });
  }
  const like = catchAsync((req, res) => setLike(req, res, true));
  const unlike = catchAsync((req, res) => setLike(req, res, false));

  const addComment = catchAsync(async (req, res) => {
    const id = assertObjectId(req.params.id, "photo id");
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!content || content.length > 500) throw new AppError("A comment must be 1 to 500 characters", 400);

    // The size check and the push are one atomic update, so the cap holds under a rush.
    const updated = await GalleryPhoto.findOneAndUpdate(
      { _id: id, [`comments.${MAX_COMMENTS - 1}`]: { $exists: false } },
      { $push: { comments: { user: req.user._id, content } } },
      { new: true, projection: { comments: { $slice: -1 } } },
    );
    if (!updated) {
      if (!(await GalleryPhoto.exists({ _id: id }))) throw new AppError("Photo not found", 404);
      throw new AppError(`This photo already has ${MAX_COMMENTS} comments`, 400);
    }
    res.status(201).json({ success: true, data: serializeComment({ ...updated.comments[0].toObject(), user: req.user }) });
  });

  const deleteComment = catchAsync(async (req, res) => {
    const photo = await loadPhoto(req.params.id);
    const commentId = assertObjectId(req.params.commentId, "comment id");
    const comment = photo.comments.id(commentId);
    if (!comment) throw new AppError("Comment not found", 404);

    const allowed =
      req.user.role === "admin" ||
      String(comment.user) === String(req.user._id) ||
      String(photo.owner) === String(req.user._id); // people moderate their own photos
    if (!allowed) throw new AppError("Not authorized to delete this comment", 403);

    await GalleryPhoto.updateOne({ _id: photo._id }, { $pull: { comments: { _id: commentId } } });
    res.status(200).json({ success: true, message: "Comment deleted" });
  });

  return { listPhotos, getPhoto, uploadPhoto, updatePhoto, deletePhoto, like, unlike, addComment, deleteComment };
}
