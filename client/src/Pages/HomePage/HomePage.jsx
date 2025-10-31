import React from 'react'
import './HomePage.css'


import Destinations from '../../Components/Destinations/Destinations'
import Footer from '../../Components/Footer/Footer'
import Home from '../../Components/Home/Home'
import Middle from '../../Components/Middle/Middle'
import Navbar from '../../Components/Navbar/Navbar'
import Portifolio from '../../Components/Portifolio/Portifolio'
import Questions from '../../Components/Questions/Questions'
import Review from '../../Components/Review/Review'
import Subscribe from '../../Components/Subscribe/Subscribe'
import Sidebar from '../../Components/Sidebar/Sidebar'

const HomePage = () => {
  return (
    <div className="HomePage">
        <Navbar/>
        <Sidebar/>
        <Home/>
        <Middle/>  
        <Destinations/>
        <Portifolio/> 
        <Review/>
        <Questions/>
        <Subscribe/>
        <Footer/> 
    </div>
  )
}

export default HomePage
