import Mongoose from "mongoose";
import blogModel from "../Models/blogModel.js";
import UserModel from "../Models/userModel.js";


//Get All Blogs
export const getAllBlogsController = async(req , res) =>{
    try {
        const blogs = await blogModel.find({}).populate("user" , "username");
        if(!blogs.length){
            return res.status(200).send({
                success:false,
                message:"No Blogs Found"
            })
        }
        return res.status(200).send({
            success:true,
            BlogCount:blogs.length,
            message:"All Blogs lists",
            blogs
        })
    } catch (err) {
        console.log(err);
        return res.status(400).send({
            success:false,
            message:"Error while getting blogs",
            err
        })
    }
}

//Create a Blog
export const createBlogController = async(req , res) =>{
    try {
        const {title, description, image , user} = req.body;

        //vadidation
        if(!title ||!description ||!image || !user){
            return res.status(400).send({
                success:false,
                message:"All fields are required"
            })
        }

        const existingUser = await UserModel.findById(user);
        //validation
        if(!existingUser){
            return res.status(400).send({
                success:false,
                message:"Unable to find user"
            })
        }

        
        const session = await Mongoose.startSession();
        session.startTransaction();
        try{
            // Create and save new blog in the session
            const newBlog = new blogModel({title, description, image , user});
            await newBlog.save({session});

            // Add blog reference to the user's blogs array
            existingUser.blogs.push(newBlog._id);
            await existingUser.save({session});

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            // await newBlog.save();

            return res.status(201).send({
            success:true,
            message:"Blog created successfully",
            blog:newBlog
            })

        }catch(err){
            console.log(err);
            // Abort transaction in case of error
            await session.abortTransaction();
            session.endSession();
            throw err; // rethrow error to be caught in the outer catch
        }
        
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success:false,
            message:"Error while creating blog",
            error
        })
    }
}

//Update a Blog
export const updateBlogController = async(req , res) =>{
    try {
        const {id} = req.params;
        const {title, description, image} = req.body;
        const blog = await blogModel.findByIdAndUpdate(id, {...req.body}, {new:true});
        return res.status(200).send({
            success:true,
            message:"Blog updated successfully",
            blog
        })
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success:false,
            message:"Error while updating blog",
            error
        })
    }
}

//Get a Single Blog
export const getBlogByIdController = async(req , res) =>{
    try {
        const {id} = req.params;
        const blog = await blogModel.findById(id);
        if(!blog){
            return res.status(404).send({
                success:false,
                message:"Blog not found"
            })
        }
        return res.status(200).send({
            success:true,
            message:"Blog found",
            blog
        })
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success:false,
            message:"Error while getting blog",
            error
        })
    }
}

//Delete a Blog
export const deleteBlogController = async(req , res) =>{
    try {
        const {id} = req.params;
        // const blog = await blogModel.findOneAndDelete({ _id: id }).populate("user");
        const blog = await blogModel.findByIdAndDelete({ _id: id }).populate("user");
        // Check if the blog exists
        if (!blog) {
            return res.status(404).send({
                success: false,
                message: "Blog not found"
            });
        }
        
        await blog.user.blogs.pull(blog._id);
        await blog.user.save();
        return res.status(200).send({
            success:true,
            message:"Blog deleted successfully"
        })
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success:false,
            message:"Error while deleting blog",
            error
        })
    }
}

//Get User Blog
export const userBlogController = async(req, res) =>{
    try {
        const userBlog = await UserModel.findById(req.params.id).populate("blogs");
        if(!userBlog){
            return res.status(404).send({
                success:false,
                message:"Blogs not found with this id"
            })
        }
        return res.status(200).send({
            success:true,
            message:"User blogs",
            userBlog
        })
    } catch (error) {
        console.log(error);
        return res.status(400).send({
            success:false,
            message:"Error in user blog",
            error
        })
    }
}