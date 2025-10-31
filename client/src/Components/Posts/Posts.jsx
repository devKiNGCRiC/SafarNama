import React from 'react'
import { useEffect } from 'react'

import './Posts.css'
import { useDispatch , useSelector } from 'react-redux'

// import { PostsData } from '../../Data/PostsData'
import Post from '../Post/Post'
import { getTimeLinePosts } from '../../Actions/postAction'
import { useParams } from 'react-router-dom'


const Posts = () => {
  const dispatch = useDispatch();
  const {user} = useSelector((state)=>state.authReducer.authData) || {};
  let {posts , loading} = useSelector((state)=>state.postReducer);
  const params = useParams();


  useEffect(()=>{
    dispatch(getTimeLinePosts(user._id))
  },[user._id])

  if(!posts) return "no post";
  if(params.id) posts = posts.filter((post)=>post.userId === params.id)

  return (
    <div className="Posts">
        {loading ? "Fetching posts..." :
          posts.map((post,id)=>{
            return <Post key={id} data={post} id={id}/>
        })
    }
    </div>
  )
}

export default Posts
