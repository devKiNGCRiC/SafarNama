import React from 'react'
import './Layout.css'
import Navbar from '../Navbar/Navbar'
import Routers from '../../Router/Routers'
import Footer from '../Footer/Footer'
const Layout = () => {
  return <>
    <Navbar />
    <Routers />
    <Footer />
  </>
}

export default Layout
