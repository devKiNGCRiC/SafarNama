// ProfileModal.jsx
import React from 'react';
import { useState } from 'react';
import { useDispatch } from'react-redux';
import './ProfileModal.scss'; // We'll create this file next
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { uploadImage } from '../../Actions/uplaodAction';
import { updateUser } from '../../Actions/UserAction';

const ProfileModal = ({ modalOpened, setModalOpened , data }) => {
  if (!modalOpened) return null;

  const {password , ...other} = data || {};
  const [formData , setFormData] = useState(other || {});
  const [profileImage , setProfileImage] = useState(null);
  const [coverImage , setCoverImage] = useState(null);
  
  const dispatch = useDispatch();
  const param = useParams();

  const {user} = useSelector((state) => state.authReducer.authData);

  const handlechange = (e) =>{
    setFormData({...formData, [e.target.name]: e.target.value });
  }

  const onImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      let img = event.target.files[0];
      event.target.name === "profilePicture" ? setProfileImage(img) : setCoverImage(img);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let UserData = {...formData};

    if (profileImage) {
      const data = new FormData();
      const filename = Date.now() + profileImage.name;
      data.append("name", filename);
      data.append("file", profileImage);
      UserData.profilePicture = filename;


      try{
        dispatch(uploadImage(data))
      }catch(err){
        console.log(err);
      }
    };

    if (coverImage){
      const data = new FormData();
      const filename = Date.now() + coverImage.name;
      data.append("name", filename);
      data.append("file", coverImage);
      UserData.coverPicture = filename;

      try{
        dispatch(uploadImage(data))
      }catch(err){
        console.log(err);
      }
    }


    dispatch(updateUser(param.id, UserData));

    setModalOpened(false);   
  };

  const handleClose = () => setModalOpened(false);

  return (
    <div className="modal-overlay" onClick={() => setModalOpened(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className='form'>
          <h2>Your Info </h2>
          <form className="infoForm">
            
            {/* Add form fields here */}
            <div>
              <input type="text" className="infoInput" name="firstname" placeholder='First Name' onChange={handlechange} value = {formData.firstname}/>
              <input type="text" className="infoInput" name="lastname" placeholder='Last Name' onChange={handlechange} value = {formData.lastname}/>   
            </div>
            <div>
              <input type="text" className="infoInput" name="bio" placeholder='Bio' onChange={handlechange} value = {formData.bio}/>  
            </div>
            <div>
              <input type="text" className="infoInput" name="livesIn" placeholder='Lives In' onChange={handlechange} value = {formData.livesIn}/>
              <input type="text" className="infoInput" name="country" placeholder='Country' onChange={handlechange} value = {formData.country}/>   
            </div>
            <div>
              <input type="text" className="infoInput" name="favouriteDestination" placeholder='Favourite Destination' onChange={handlechange} value = {formData.favouriteDestination}/>
              <input type="text" className="infoInput" name="favouriteActivity" placeholder='Favourite Activity' onChange={handlechange} value = {formData.favouriteActivity}/>   
            </div>
            <div>
              <input type="text" className="infoInput" name="relationship" placeholder='Relationship Status' onChange={handlechange} value = {formData.relationship}/> 
              <input type="text" className="infoInput" name="worksAt" placeholder='Works At' onChange={handlechange} value = {formData.worksAt}/> 
              <input type="text" className="infoInput" name="Education" placeholder='Education' onChange={handlechange} value = {formData.Education}/>
            </div>

            <div>
              Profile Image
              <input type="file" name="profilePicture" onChange={onImageChange}/>
              Cover
              <input type="file" name="coverPicture" onChange={onImageChange}/>
            </div>
          </form>
        </div>
        
        <div>
          <button className='button pm-button' onClick = {handleSubmit}>Update</button>
          <button className='button pm-button' onClick={handleClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
