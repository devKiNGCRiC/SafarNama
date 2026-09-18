import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux'
import { followUser, unFollowUser } from '../../actions/UserAction';
import '../FollowersCard/FollowersCard.css'
import { API_URL } from '../../config/api';

const User = ({person}) => {
    
    const { user } = useSelector((state) => state.authReducer.authData);
    const [following, setFollowing] = useState(person.followers.includes(user._id));


    const dispatch = useDispatch();
    const publicFolder = `${API_URL}/images/`;

    const handleFollow = () => {
        following ? dispatch(unFollowUser(person._id, user)) : dispatch(followUser(person._id, user));
        setFollowing((prev) => !prev);
    }

  return (
    <div className="follower" >
        <div>
            <img src={person.profilePicture ? publicFolder + person.profilePicture : publicFolder + "defaultProfilepic2.jpg"} className='followerImage' />
            <div className='name'>
                <span>{person.firstname.concat(" " , person.lastname) }</span>
                <span>@{person.username}</span>
            </div>
        </div>
        <button className={following ? "button fc-button unfollowbutton" : "button fc-button"} onClick={handleFollow}>{following ? "Unfollow" : "Follow"}</button>
    </div>
  )
}

export default User
