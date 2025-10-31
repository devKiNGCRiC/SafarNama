import React , {useState} from 'react'
import './RightSide.css'
import TrendCard from '../TrendCard/TrendCard'

import Home from '../../Assets/img/home.png'
import Noti from '../../Assets/img/noti.png'
import Comment from '../../Assets/img/comment.png'
//import {UilSetting} from '@iconscout/react-unicons'
import { FcSettings } from "react-icons/fc";
import ShareModal from '../ShareModel/ShareModal'
import { Link } from 'react-router-dom'

const RightSide = () => {
  const [modalOpened , setModalOpened] = useState(false);

  return (
    <div className="RightSide">
      <div className="NavIcons">
        <Link to ="/homegram"><img src={Home} alt="" /></Link>

        <FcSettings style={{fontSize: "xx-large"}}/>{/* <UilSetting /> */}
        <img src={Noti} alt="" />
        <img src={Comment} alt="" />
      </div>
      
      <TrendCard/>

      <button className="button r-button" onClick={() => setModalOpened(true)}>Share</button>
      <ShareModal modalOpened={modalOpened} setModalOpened={setModalOpened}/>
    </div>
  )
}

export default RightSide
