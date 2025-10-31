

import React from 'react'
import {Routes , Route, Navigate} from'react-router-dom'

import HomePage from '../Pages/HomePage/HomePage';
import Tours from '../Pages/Tours/Tours';
import SearchResultList from '../Pages/SearchResultList/SearchResultList';
import TourDetail from '../Pages/TourDetail/TourDetail';
const Routers = () => {
  return (
    <Routes>
        <Route path='/' element={<Navigate to='/home' />} />
        <Route path='/' element={<HomePage />} />
        <Route path='/tours' element={<Tours />} />
        <Route path='/tours/:id' element={<TourDetail />} />
        <Route path='/tours/search' element={<SearchResultList />} />
    </Routes>
  )
}

export default Routers