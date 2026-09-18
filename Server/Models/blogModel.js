import Mongoose from "mongoose";

const blogSchema = new Mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
    },
    excerpt: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      required: [true, "Please provide an image"],
    },
    category: {
      type: String,
      default: "Travel",
    },
    tags: {
      type: [String],
      default: [],
    },
    user: {
      type: Mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide a user"],
    },
    // createdAt:{
    //     type:Date,
    //     default:Date.now
    // },
    // comments:[{
    //     type:Mongoose.Schema.Types.ObjectId,
    //     ref:"Comment"
    // }],
    // likes:[{
    //     type:Mongoose.Schema.Types.ObjectId,
    //     ref:"User"
    // }],
  },
  { timestamps: true },
);

const blogModel = Mongoose.model("Blog", blogSchema);
export default blogModel;
