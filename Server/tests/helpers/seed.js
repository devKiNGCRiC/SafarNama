import SafarPost from "../../Models/safargramPostModel.js";

// `author` is either a createUser() result ({ user, ... }) or a plain user document.
export const seedPost = (author, extra = {}) =>
  SafarPost.create({
    author: author.user ? author.user._id : author._id,
    media: [{ type: "image", url: "https://cdn.test/x.jpg", publicId: "x" }],
    caption: "hello",
    ...extra,
  });
