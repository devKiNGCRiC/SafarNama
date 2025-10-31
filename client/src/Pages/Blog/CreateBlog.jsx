import React , {useState} from 'react'
import "./CreateBlog.css"
import { Box, Button, InputLabel, TextField, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import toast from 'react-hot-toast';
const CreateBlog = () => {
    const navigate = useNavigate();
    const id = localStorage.getItem("userId");
    const [inputs , setInputs] = useState({
        title: "",
        description: "",
        image: "",
        user:""
    });

    //input change handler
    const handleChange =(e) => {
        setInputs(prevState => ({...prevState, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        try {
            const {data} = await axios.post('http://localhost:5000/api/v1/blog/create-blog',{
                title: inputs.title,
                description: inputs.description,
                image: inputs.image,
                user: id
            })
            if(data?.success){
                toast.success("Blog Created")
                navigate("/myblog")
            }
        } catch (error) {
            console.log(error)      
        }
        
    }
  return (
    <div className='CreateBlog'>
      <>
        <form onSubmit={handleSubmit}>
            <Box width={'40%'} border={3} borderRadius={10} padding={2} margin={'auto'} boxShadow={'10px 10px 20px #ccc'} display={'flex'} flexDirection={"column"}>
                <Typography variant='h4' textAlign={"center"} fontWeight={"bold"} color='grey'>
                    Create A Post <hr/>
                </Typography>
                <InputLabel sx={{mb:1, mt:2, fontSize:"24px", fontWeight:"bold"}}>Title</InputLabel>
                <TextField name="title" value={inputs.title} onChange={handleChange} margin='normal' variant='outlined' required/>
                <InputLabel sx={{mb:1, mt:2, fontSize:"24px", fontWeight:"bold"}}>Description</InputLabel>
                <TextField name="description" value={inputs.description} onChange={handleChange} margin='normal' variant='outlined' required/>
                <InputLabel sx={{mb:1, mt:2, fontSize:"24px", fontWeight:"bold"}}>Image URL</InputLabel>
                <TextField name="image" value={inputs.image} onChange={handleChange} margin='normal' variant='outlined' required/>
                <Button sx={{mt:2, borderRadius:10}} variant='contained' color='primary' type='submit'>Submit</Button>
            </Box>
        </form>
      </>
    </div>
  )
}

export default CreateBlog

