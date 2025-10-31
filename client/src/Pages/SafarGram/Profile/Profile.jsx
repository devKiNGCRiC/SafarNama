import React from 'react'
import './Profile.css'
import ProfileLeft from '../../../Components/ProfileLeft/ProfileLeft'
import PostSide from '../../../Components/PostSide/PostSide'
import RightSide from '../../../Components/RightSide/RightSide'
import ProfileCard from '../../../Components/ProfileCard/ProfileCard'

const Profile = () => {
  return (
    <div className="Profile">
        <ProfileLeft/>

        <div className="ProfileCenter">
            <ProfileCard location = "profilePage"/>
            <PostSide />
        </div>
        
        {/* <RightSide /> */}
    </div>
  )
}

export default Profile
