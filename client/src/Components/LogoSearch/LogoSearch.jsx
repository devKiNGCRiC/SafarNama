import React from 'react'
import './LogoSearch.css'
//import {UilSearch} from '@iconscout/react-unicons'
import { FaSearch } from 'react-icons/fa';
import logo from '../../Assets/logo.jpg'
import { Link } from 'react-router-dom';
import Home from '../../Assets/img/home.png'

const LogoSearch = () => {
  return (
    <div className="LogoSearch">
        <Link to="/"><img src={logo} alt="" className='image'/></Link>
        {/* <div className="Search">
            <input type="text" placeholder='#Explore' />
            <div className="s-icon">
              <FaSearch /> {/* React Icons Search */}
                {/* <UilSearch /> */}
            {/*</div>
        </div> */}
        <div className="NavIcons">
          <Link to ="/homegram"><img src={Home} alt="" /></Link>
        </div>
    </div>
  )
}

export default LogoSearch
