import React, { useState , useEffect } from 'react'
import './Post.css'
import { useSelector } from 'react-redux'

// Importing img
import Comment from '../../Assets/img/comment.png'
import Share from '../../Assets/img/share.png'
import Heart from '../../Assets/img/like.png'
import NotLike from '../../Assets/img/notlike.png'
import { likePost , addComment , getComments } from '../../api/PostRequest'
import { API_URL } from '../../config/api';



const Post = ({data}) => {
  const  {user} = useSelector((state)=>state.authReducer.authData);

  
  const publicFolder = `${API_URL}/images/`;

  // // Use the REACT_APP_PUBLIC_FOLDER environment variable
  // const publicFolder2 = process.env.REACT_APP_PUBLIC_FOLDER;

  const [liked , setLiked] = useState(false);
  const [likes, setLikes] = useState([]);
      
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    setLikes(data.likes || []);
    setLiked(data.likes?.includes(user._id) || false);
    
    fetchComments();
    
  }, [data._id,data.likes , user._id]);

  const fetchComments = async () => {
    try {
      const res = await getComments(data._id);
      setComments(res.data || []);
    } catch (error) {
      console.error("Failed to load comments", error);
    }
  };

  const handleLike = async () => {
    try {
      await likePost(data._id, user._id);

      // Update local state
      const newLiked = !liked;
      setLiked(newLiked);

      // Update likes array
      if (newLiked) {
        setLikes(prev => [...prev, user._id]);
      } else {
        setLikes(prev => prev.filter(id => id !== user._id));
      }
    } catch (error) {
      console.error("Failed to like post:", error);
      // Revert state on error
      setLiked(!liked);
    }
  };

  // const handleLike = async () => {
  //   setLiked((prev) => !prev);
  //   likePost(data._id , user._id);
  //   liked ? setLikes((prev) => prev - 1) : setLikes((prev) => prev + 1);
  // }

  //Handle comments
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await addComment(data._id, {
        userId: user._id,
        text: newComment.trim()
      });

      if (response.data) {
        // Add the new comment to the existing comments
        setComments(prevComments => [...prevComments, {
          userId: user._id,
          text: newComment.trim(),
          createdAt: new Date()
        }]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
    }
  };


  const handleShowComments = async () => {
    if (!showComments) {
      // Fetch fresh comments when opening the comments section
      await fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${data._id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        alert("Post link copied to clipboard!");
      })
      .catch((error) => {
        console.error("Failed to copy link:", error);
        // Fallback for browsers that don't support clipboard API
        const tempInput = document.createElement("input");
        tempInput.value = postUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand("copy");
        document.body.removeChild(tempInput);
        alert("Post link copied to clipboard!");
      });
  };


  return (
    <div className="Post">
        {/* Image rendering */}
        { data.image && <img src={`${publicFolder}${data.image}`} alt="post" />}
        
        {/* <img src={data.image ? process.env.REACT_APP_PUBLIC_FOLDER + data.image : ""} alt="" /> */}
      
        <div className="postReact">
            <img src={liked ? Heart : NotLike} alt="like"  style={{cursor:"pointer"}}  onClick={handleLike}/>
            <img src={Comment} alt="comment" style={{ cursor: "pointer" }}  onClick={handleShowComments}/>
            <img src={Share} alt="Share" style={{ cursor: "pointer" }}  onClick={handleShare}/>
        </div>

        <span style={{color: "var(--gray)" , fontsize : '12px'}}>{likes.length} Likes</span>
        
        <div className="details">
            <span><b>{data.username}</b></span>
            <span> {data.desc}</span>
        </div>


        <div className="recent-comments">
        {comments.slice(-2).map((comment, idx) => (
          <div key={idx} className="comment">
            <span><b>{comment.userId}</b>: </span>
            {comment.text}
          </div>
        ))}
        </div>

        {/* Last Two Comments Below Description */}
        {/* {comments.slice(-2).map((comment, idx) => (
          <div key={idx} className="comment">
            <span><b>{comment.userId}</b></span>: {comment.text}
          </div>
        ))} */}

        {/* Show All Comments in a Scrollable Modal/Card */}
        {showComments && (
          <div className="commentsModal">
            <div className="commentsModalContent">
              {comments.map((comment, idx) => (
                <div key={idx} className="comment">
                  <span><b>{comment.userId}</b>: </span> {comment.text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comment Form Section */}
            <form onSubmit={handleCommentSubmit} className="commentForm">
              <input
                type="text"
                className="commentInput"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <button type="submit" className = "button commentButton " disabled={!newComment.trim()}>Comment</button>
            </form>
    </div>


    
  )
}

export default Post
