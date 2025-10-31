import React , {useState , useEffect} from 'react'
import './BlogDetails.css'
import axios from 'axios'
import { useParams , useNavigate } from 'react-router-dom'
import { Box, Button, InputLabel, TextField, Typography } from '@mui/material'
import toast from 'react-hot-toast';
const BlogDetails = () => {
    const {id} = useParams();
    const [blog , setBlog] = useState({})
    const navigate = useNavigate();
    const [inputs , setInputs] = useState({});

    //get blog details
    const getBlogDetail = async () => {
        try {
            const {data} = await axios.get(`http://localhost:5000/api/v1/blog/get-blog/${id}`)
            if(data?.success) {
            setBlog(data?.blog)
            setInputs({
                title: data?.blog.title,
                description: data?.blog.description,
                image: data?.blog.image
            })
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        getBlogDetail()
    }, [id])

    console.log(blog);
    //input change handler
    const handleChange =(e) => {
        setInputs(prevState => ({...prevState, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            const {data} = await axios.put(`http://localhost:5000/api/v1/blog/update-blog/${id}`,{
                title: inputs.title,
                description: inputs.description,
                image: inputs.image,
                user: id
            })
            if(data?.success){
                toast.success("Blog Updated")
                navigate("/myblog")
            }
        } catch (error) {
            console.log(error)      
        }
        
    }
  return (
    <div className='BlogDetails'>
      <form onSubmit={handleSubmit}>
            <Box width={'40%'} border={3} borderRadius={10} padding={2} margin={'auto'} boxShadow={'10px 10px 20px #ccc'} display={'flex'} flexDirection={"column"}>
                <Typography variant='h4' textAlign={"center"} fontWeight={"bold"} color='grey'>
                    Edit A Post <hr/>
                </Typography>
                <InputLabel sx={{mb:1, mt:2, fontSize:"24px", fontWeight:"bold"}}>Title</InputLabel>
                <TextField name="title" value={inputs.title} onChange={handleChange} margin='normal' variant='outlined' required/>
                <InputLabel sx={{mb:1, mt:2, fontSize:"24px", fontWeight:"bold"}}>Description</InputLabel>
                <TextField name="description" value={inputs.description} onChange={handleChange} margin='normal' variant='outlined' required/>
                <InputLabel sx={{mb:1, mt:2, fontSize:"24px", fontWeight:"bold"}}>Image URL</InputLabel>
                <TextField name="image" value={inputs.image} onChange={handleChange} margin='normal' variant='outlined' required/>
                <Button sx={{mt:2, borderRadius:10}} variant='contained' color='warning' type='submit'>Update</Button>
            </Box>
        </form>
    </div>
  )
}

export default BlogDetails
