import React , {useState , useRef} from 'react'
import './PostShare.css'
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
//import { axios } from 'axios';

// import { UilScenery } from '@iconscout/react-unicons'
import { FaImage } from 'react-icons/fa';
// import {UilPlayCircle} from '@iconscout/react-unicons'
import { FaPlayCircle } from 'react-icons/fa'
// import {UilLocationPoint} from '@iconscout/react-unicons'
import { FaMapMarkerAlt } from 'react-icons/fa';
// import {UilSchedule} from '@iconscout/react-unicons'
import { GrSchedule } from "react-icons/gr";
// import {UilTimes} from '@iconscout/react-unicons'
import { FaTimes } from 'react-icons/fa'; 

import KiNG from '../../Assets/img/KiNG.jpg'
import { uploadImage , uploadPost } from '../../Actions/uplaodAction';

const PostShare = () => {
    const loading = useSelector((state) => state.postReducer.uploading);
    const[image , setImage] = useState(null);
    const imageRef = useRef();
    const dispatch = useDispatch();

    const desc = useRef();
    const { user } = useSelector((state) => state.authReducer.authData) || {};
    const publicFolder = "http://localhost:5000/images/";

    const onImageChange = (event) => {
        if(event.target.files && event.target.files[0]){
            let img = event.target.files[0];
            setImage(img);
        }
    }

    const reset = () => {
        setImage(null);
        desc.current.value = "";
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newPost = {
            userId : user._id,
            desc : desc.current.value,
        }

        if(image){
            const data = new FormData();
            const fileName = Date.now() + image.name;
            data.append("name", fileName);
            data.append("file", image);
            newPost.image = fileName;
            console.log(newPost);

            try{
                dispatch(uploadImage(data))
            }catch(err){
                console.log(err);
            }
        }
        dispatch(uploadPost(newPost))
        reset();
    }

  return (
    <div className='PostShare'>
        <img src={user.profilePicture ? publicFolder + user.profilePicture : publicFolder + "defaultProfilepic2.jpg"} alt="Profile Image"/>
        <div>
            <input ref={desc} required type="text"  placeholder = "What's Happening" />
        
            <div className="postOptions">
                <div className="option" style = {{color: "var(--photo)"}} onClick={() => imageRef.current.click()}><FaImage />{/* <UilScenery /> */} Photo</div>
                {/* <div className="option" style = {{color: "var(--video)"}}><FaPlayCircle /> Video</div> */}{/* <UilPlayCircle /> */}
                {/* <div className="option" style = {{color: "var(--location)"}}><FaMapMarkerAlt /> Location</div> */}{/*<UilLocationPoint />*/}
                {/* <div className="option" style = {{color: "var(--shedule)"}}><GrSchedule /> schedule </div> */}{/*<UilSchedule />*/}

                <button className="button ps-button" onClick={handleSubmit} disabled={loading}>
                    {loading ? "Uploading..." : "Share"}
                </button>

                <div style={{display: "none"}}>
                    <input type="file" name="myImage" ref={imageRef} onChange={onImageChange}/>
                </div>
            </div>

            {image && 
                <div className="previewImage">
                    {/* <UilTimes onClick={() => setImage(null)}/> */}
                    <FaTimes onClick={() => setImage(null)} style={{fontSize : "x-large"}}/>
                    <img src={URL.createObjectURL(image)} alt="Preview" />
                </div>}
        </div>
    </div>
  )
}

export default PostShare
