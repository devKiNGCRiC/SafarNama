import Mongoose from "mongoose";

const postSchema = Mongoose.Schema({

    userId: { type: String, required: true },
    desc: String,
    likes: [],
    image: String,
    comments: [
      {
        userId: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
},
{
    timestamps: true,
});

const PostModel = Mongoose.model("Post", postSchema);
export default PostModel;