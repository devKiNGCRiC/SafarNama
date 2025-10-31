import React , {useState , useEffect} from 'react'
import { Link } from 'react-router-dom'
import './MyBlog.css'
import axios from 'axios'
import BlogCard from '../../Components/BlogCard/BlogCard'

const MyBlog = () => {
  const [blogs , setBlogs] = useState([])

  //get user Blog
  const getUserBlog = async () => {
    try {
      const id = localStorage.getItem('userId')
      const { data } = await axios.get(`http://localhost:5000/api/v1/blog/user-blog/${id}`);
      if(data?.success){
        setBlogs(data?.userBlog.blogs)
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getUserBlog()
  }, [])

  console.log(blogs)
  return (
    <div className='MyBlog'>
      <div className='links'>
        <Link to ='/blogs' ><h2 className='link2'>Blog</h2></Link>
        <Link to ='/create-blog' ><h2 className='link2'>Create Blog</h2></Link>  
      </div>
      
      {blogs && blogs.length > 0 ? (blogs.map((blog) => 
            (<BlogCard className="blog-card"
              id = {blog._id}
              isUser = {true}
              title = {blog.title}
              description = {blog.description}
              image = {blog.image}
              username = {blog.user.username}
              // date = {blog.date}
              time = {blog.createdAt}
            />
          ))):(<p> No Blogs Found , You Haven't Created a blog yet</p>)}
    </div>
  )
}

export default MyBlog
