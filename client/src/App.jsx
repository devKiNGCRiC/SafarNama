import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './store/index';
import './App.css';
// import { useAuthPersist } from './hooks';

// Components
import SplashScreen from './Components/SplashScreen/SplashScreen';
import Navbar from './Components/Navbar/Navbar';
import Sidebar from './Components/Sidebar/Sidebar';
import Footer from './Components/Footer/Footer';
import ProtectedRoute from './Components/Auth/ProtectedRoute';

// Pages
import Auth from './Pages/Auth/Auth';
import HomePage from './Pages/HomePage/HomePage';
import AllDestinations from './Pages/AllDestination/AllDestination';
import DestinationDetail from './Pages/Destination/DestinationDetail';
import ItineraryBuilder from './Pages/Itinerary/ItineraryBuilder';
import Events from './Pages/Events/Events';
import EcoGuides from './Pages/EcoGuides/EcoGuides';
import AboutUs from './Pages/AboutUs/AboutUs';
import MapPage from './Pages/MapPage/MapPage';
import Feedback from './Pages/Feedback/Feedback';
import Contact from './Pages/Contact/Contact';

import FAQ from './Pages/FAQ/FAQ';
import HomeGram from './Pages/SafarGram/HomeGram/HomeGram';
import TourBooking from './Pages/Booking/TourBooking';
import Payment from './Pages/Payment/Payment';
import ThankYou from './Pages/Thankyou/ThankYou';
import Blogs from './Pages/Blog/Blogs';
import MyBlog from './Pages/Blog/MyBlog';
import SearchResultList from './Pages/SearchResultList/SearchResultList';
import TourListing from './Pages/Tours/TourListing/TourListing';
import TourDetail from './Pages/Tours/TourDetail/TourDetail';
import CreateBlog from './Pages/Blog/CreateBlog';
import BlogDetails from './Pages/Blog/BlogDetails';
// import CommunityForum from './Pages/CommunityForum/CommunityForum';
// import CreateForumPost from './Pages/CommunityForum/CreateForumPost';
import DesignShowcase from './Pages/Test/DesignShowcase';

import { Toaster } from 'react-hot-toast';
import { loginSuccess } from './store/reducers/authSlice';
import Profile from './Pages/Profile/Profile';
import BookingHistory from './Pages/BookingHistory/BookingHistory';


const AppContent = () => {
    // useAuthPersist();
    const [showSplash, setShowSplash] = useState(true);
    const [isAppReady, setIsAppReady] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            dispatch(loginSuccess({
                user: JSON.parse(user),
                token
            }));
        }
        
        // Mark app as ready after a small delay
        setTimeout(() => setIsAppReady(true), 100);
    }, [dispatch]);
    
    const handleSplashFinish = () => {
        setShowSplash(false);
    };

    // Show splash screen until app is ready
    if (showSplash || !isAppReady) {
        return <SplashScreen onFinish={handleSplashFinish} />;
    }

    return (
        <div className='App'>
            
                <Toaster />
                <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        {/* Public Routes */}
                        <Route path='/' element={<Navigate to='/home' />} />
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/auth" element={
                            <div>
                                <Navbar />
                                <Sidebar />
                                <Auth />
                                <Footer />
                            </div>
                        } />
                        <Route path="/aboutus" element={
                            <div>
                                <Navbar />
                                <Sidebar />
                                <AboutUs />
                                <Footer />
                            </div>
                        } />
                        
                        <Route path="/contact-Us" element={<Contact />} />
                        <Route path="/map" element={
                            <div>
                                <Navbar />
                                <Sidebar />
                                <MapPage />
                                <Footer />
                            </div>
                        } />

                        {/* Protected Routes */}
                        <Route path="/profile/:username?" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <Profile />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />
                        <Route path="/me" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <Profile />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />
                        <Route path="/homegram" element={
                            <ProtectedRoute>
                                <div className="App">
                                    <div className="blur" style={{top: '-14%', right: '0'}}></div>
                                    <div className="blur" style={{top: '38%', left: '-8rem'}}></div>
                                    <Sidebar />
                                    <HomeGram />
                                </div>
                            </ProtectedRoute>
                        } />

                        {/* <Route path="/profile/:id" element={
                            <ProtectedRoute>
                                <div className="App">
                                    <div className="blur" style={{top: '-14%', right: '0'}}></div>
                                    <div className="blur" style={{top: '38%', left: '-8rem'}}></div>
                                    <Sidebar />
                                    <Profile />
                                </div>
                            </ProtectedRoute>
                        } /> */}

                        <Route path="/blogs" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <Blogs />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />

                        <Route path="/myblog" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <MyBlog />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />

                        <Route path="/create-blog" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <CreateBlog />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />

                        {/* <Route path="/blog-details/:id" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <BlogDetails />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } /> */}

                        <Route path="/booking" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <TourBooking />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />

                        {/* <Route path="/communityforum" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <CommunityForum />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />

                        <Route path="/create-forum-post" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <CreateForumPost />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } /> */}

                        <Route path="/feedback" element={
                            <ProtectedRoute>
                                <div>
                                    <Navbar />
                                    <Sidebar />
                                    <Feedback />
                                    <Footer />
                                </div>
                            </ProtectedRoute>
                        } />

                        {/* Semi-Protected Routes (View public, actions protected) */}
                        <Route path="/destinations" element={
                            <div>
                                <Sidebar />
                                <AllDestinations />
                            </div>
                        } />
                        
                        <Route path="/destinations/:id" element={
                            <div>
                                <DestinationDetail />
                            </div>
                        } />

                        <Route path="/eco-guides" element={<EcoGuides />} />
                        <Route path="/itinerary" element={<ItineraryBuilder />} />
                        <Route path="/events" element={<Events />} />
                        <Route path="/FAQ" element={<FAQ />} />
                        
                        <Route path="/tours" element={<TourListing />} />
                        <Route path="/tours/:id" element={<TourDetail />} />
                        <Route path="/payment" element={<Payment />} />
                        
                        <Route path="/thank-you" element={<ThankYou />} />
                        <Route path="/bookings" element={<BookingHistory />} />
                        
                        {/* Design System Showcase (Development Only) */}
                        <Route path="/design-showcase" element={<DesignShowcase />} />
                        
                        {/* <Route path='/tours' element={<Tours />} />
                        <Route path='/tours/:id' element={<TourDetail />} />
                        <Route path='/tours/search' element={<SearchResultList />} />
                        <Route path="/payments" element={<Payment />} />
                        <Route path="/thankyou" element={<ThankYou />} /> */}
                    </Routes>
                </Router>
            
        </div>
    );
}

function App(){
   
  return (
    <div>
        <Provider store={store}>
            <AppContent />
        </Provider>
    </div>
  );
}

export default App;