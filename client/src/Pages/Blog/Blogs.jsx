import React , {useState , useEffect} from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import './Blogs.css'
import BlogCard from '../../Components/BlogCard/BlogCard'


const Blogs = () => {
  const [blogs , setBlogs] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  //get blogs
  const getAllBlogs = async () => {
    console.log("Fetching blogs...");
    try{
      const { data } = await axios.get('http://localhost:5000/api/v1/blog/all-blog');
      if(data?.success){
        setBlogs(data?.blogs)
        console.log(data);
      }
    }catch(err){
      console.log(err)
      setError(err.message);
    }finally {
      setLoading(false);
    }
  }

  //useEffect to fetch blogs on page load
  useEffect(() => {
    getAllBlogs();
  } , []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='Blogs'>
      <div>
        <Link to ='/myblog'><h3 className='link'>My Blogs</h3></Link>  
      </div>
      <div>
          {blogs && blogs.length > 0 ? (blogs.map((blog) => 
            (<BlogCard
              id = {blog?._id}
              //isUser = {localStorage.getItem('userId') === blog.user._id}
              title = {blog?.title}
              description = {blog?.description}
              image = {blog?.image}
              //username = {blog?.user.username}
        
              time = {blog.createdAt}
            />
          ))):(<p> No Blogs Found</p>)}
        </div>
      {/* <BlogCard /> */}
    </div>
  )
}

export default Blogs
