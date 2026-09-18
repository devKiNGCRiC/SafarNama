import React from 'react'
import './ProfileCard.css'

import { useSelector } from'react-redux'

//Importing Images
import Cover from '../../Assets/img/KiNG2.jpg'
import Profile from '../../Assets/img/KiNG.jpg'
import { Link } from 'react-router-dom'
import { API_URL } from '../../config/api';

const ProfileCard = ({location}) => {

    const {user} = useSelector((state)=>state.authSkice.authData) || {};
    const posts = useSelector((state)=>state.postReducer.posts);

    const publicFolder = `${API_URL}/images/`;

    //const ProfilePage = false;

  return (
    <div className="ProfileCard">
        <div className="ProfileImages">
            <img src={user.coverPicture ? publicFolder + user.coverPicture : publicFolder + "defaultCoverpic.jpg"} alt="" />
            <img src={user.profilePicture ? publicFolder + user.profilePicture : publicFolder + "defaultProfilepic2.jpg"} alt="" />
        </div>

        <div className="ProfileName">
            <span>{user.firstname} {user.lastname}</span>
            <span>{user.bio ? user.bio : "Write about yourself"}</span>
        </div>

        <div className="followStatus">
            <hr/>
            <div>
                <div className="follow">
                    <span>{user.following.length}</span>
                    <span>Following</span>
                </div>
                <div className="vl"></div>
                <div className="follow">
                    <span>{user.followers.length}</span>
                    <span>Followers</span>
                </div>

                {location === "profilePage" && (
                    <>
                        <div className="vl"></div>
                        <div className="follow">
                            <span>{posts.filter((post) => post.userId === user._id).length}</span>
                            <span>Posts</span>
                        </div>
                    </>
                )}

            </div>
            <hr/>
        </div>
        
        {location === "profilePage" ? "" : <span>
            <Link to= {`/profile/${user._id}`} style={{textDecoration: "none", color: "inherit"}}> My Profile</Link>
        </span>}
        
    </div>
  )
}

export default ProfileCard
