import React, { useState } from 'react';

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import * as UserApi from '../../Api/UserRequest.js';

import './InfoCard.css';

// import { UilPen } from '@iconscout/react-unicons';
import { FaPen } from 'react-icons/fa';
import ProfileModal from '../ProfileModal/ProfileModal';
import { logOut } from '../../Actions/AuthAction.js';


const InfoCard = () => {
    const [modalOpened, setModalOpened] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const profileUserId = params.id;

    const [profileUser, setProfileUser] = useState({});

    const {user} = useSelector((state) => state.authReducer.authData);

    useEffect(() => {
        const fetchProfileUser = async () => {
            if (profileUserId === user._id) {
                setProfileUser(user);
                // console.log(user);
            } else {
                const response = await UserApi.getUser(profileUserId);
                setProfileUser(profileUser);
                // console.log(profileUser);
            }
        };

        fetchProfileUser();
    }, [dispatch, profileUserId, user]);

    const handleLogOut = () => {
        dispatch(logOut());
        navigate('/auth');
    };    

    return (
        <div className="InfoCard">
            <div className="InfoHead">
                <h4>Profile Info</h4>
                {user._id === profileUserId ? (
                    <div>
                        {/* <UilPen width="2rem" height="1.2rem" onClick={() => setModalOpened(true)} /> */}
                        <FaPen width="2rem" height="1.2rem" onClick={() => setModalOpened(true)}/> 
                        <ProfileModal modalOpened={modalOpened} setModalOpened={setModalOpened} data = {user} />
                    </div>
                ) : (" ")}
                
            </div>
            {/* const infoData = [
        { label: 'Bio : ', value: "I'm a Cricketer" },
        { label: 'Relationship Status : ', value: 'Single' },
        { label: 'Lives in : ', value: 'Guwahati, Assam' },
        { label: 'Schooling from : ', value: 'Vivekananda Kendra Vidyalaya' },
        { label: 'Works at : ', value: '' },
        { label: 'Favourite Destination : ', value: 'Spiti Valley , Tawang' },
        { label: 'Favourite Activity : ', value: 'Trekking , Hiking' },
        { label: 'Joined Safarnama : ', value: '28 June 2024' }
    ]; */}
            
            <div className="info">
                <span><b>Bio : </b></span>
                <span>{profileUser.bio}</span>
            </div>
            <div className="info">
                <span><b>Relationship Status : </b></span>
                <span>{profileUser.relationship}</span>
            </div>
            <div className="info">
                <span><b>Lives in : </b></span>
                <span>{profileUser.livesIn}</span>
            </div>
            <div className="info">
                <span><b>Works at : </b></span>
                <span>{profileUser.worksAt}</span>
            </div>
            <div className="info">
                <span><b>Education From : </b></span>
                <span>{profileUser.Education}</span>
            </div>
            <div className="info">
                <span><b>Favourite Destination : </b></span>
                <span>{profileUser.favouriteDestination}</span>
            </div>
            <div className="info">
                <span><b>Favourite Activity : </b></span>
                <span>{profileUser.favouriteActivity}</span>
            </div>
            
            <button className="button logout-button" onClick={handleLogOut}>LogOut</button>
        </div>
    );
};

export default InfoCard;























// import React , {useState} from 'react'
// import './InfoCard.css'
// import {UilPen} from '@iconscout/react-unicons'
// import ProfileModal from '../ProfileModal/ProfileModal'


// const InfoCard = () => {

//     const [modalOpened , setModalOpened] = useState(false);

//   return (
//     <div className="InfoCard">
//         <div className="InfoHead">
//             <h4>Your Info </h4>
//             <div>
//                 <UilPen width="2rem" height="1.2rem"  onClick={() => setModalOpened(true)}/>
//                 <ProfileModal modalOpened={modalOpened} setModalOpened={setModalOpened}/>
//             </div>
//         </div>
//         <div className="info">
//             <span><b>Relationship Status :</b></span>
//             <span>Single</span>
//         </div>
//         <div className="info">
//             <span><b>Lives in :</b> </span>
//             <span>Guwahati , Assam</span>
//         </div>
//         <div className="info">
//             <span><b>Studies at :</b> </span>
//             <span>Vivekanada Kendra Vidyalaya</span>
//         </div>
//         <div className="info">
//             <span><b>Favourite Destination :</b></span>
//             <span>Spiti Valley</span>
//         </div>
//         <div className="info">
//             <span><b>Favourit Activity :</b></span>
//             <span>Trekking</span>
//         </div>
//         <div className="info">
//             <span><b>Joined Safarnama :</b></span>
//             <span>28 June 2004</span>
//         </div>

        
//         <button className="button logout-button">LogOut</button>
            
//     </div>
//   )
// }

// export default InfoCard
