import React from 'react'
import './HomeGram.css'
import ProfileSide from '../../../Components/ProfileSide/ProfileSide'
import PostSide from '../../../Components/PostSide/PostSide'
import RightSide from '../../../Components/RightSide/RightSide'


const HomeGram = () => {
  return (
    <div className="HomeGram">
        <div className="HgSec">
          <ProfileSide />
          <PostSide />
          {/* <RightSide /> */}
        </div>
    </div>
  )
}

export default HomeGram
