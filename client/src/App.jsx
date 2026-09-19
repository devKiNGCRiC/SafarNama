import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import store from "./store/index";
import "./App.css";
import "./styles/indian-theme.css"; // 🇮🇳 Legendary Indian Nature Theme

// Critical Components (load immediately)
import SplashScreen from "./Components/SplashScreen/SplashScreen";
import Navbar from "./Components/Navbar/Navbar";
import Sidebar from "./Components/Sidebar/Sidebar";
import Footer from "./Components/Footer/Footer";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import Loader from "./Components/Loader/Loader";
import HomePage from "./Pages/HomePage/HomePage"; // Keep home page immediate

import { Toaster } from "react-hot-toast";
import { loginSuccess } from "./store/reducers/authSlice";
import { ChatProvider } from "./features/chat/ChatProvider";

// Lazy Load Pages (load only when needed)
const Auth = lazy(() => import("./Pages/Auth/Auth"));
const AllDestinations = lazy(
  () => import("./Pages/AllDestination/AllDestination"),
);
const DestinationDetail = lazy(
  () => import("./Pages/Destination/DestinationDetail"),
);
const ItineraryBuilder = lazy(
  () => import("./Pages/Itinerary/ItineraryBuilder"),
);
const Events = lazy(() => import("./Pages/Events/Events"));
const EcoGuides = lazy(() => import("./Pages/EcoGuides/EcoGuides"));
const AboutUs = lazy(() => import("./Pages/AboutUs/AboutUs"));
const MapPage = lazy(() => import("./Pages/MapPage/MapPage"));
const Feedback = lazy(() => import("./Pages/Feedback/Feedback"));
const Contact = lazy(() => import("./Pages/Contact/Contact"));
const FAQ = lazy(() => import("./Pages/FAQ/FAQ"));
const SafarFeed = lazy(() => import("./features/safargram/pages/FeedPage"));
const SafarPost = lazy(() => import("./features/safargram/pages/PostPage"));
const SafarTag = lazy(() => import("./features/safargram/pages/TagPage"));
const SafarSaved = lazy(() => import("./features/safargram/pages/BucketListPage"));
const SafarExplore = lazy(() => import("./features/safargram/pages/ExplorePage"));
const ChatPage = lazy(() => import("./features/chat/pages/ChatPage"));
const SafarDestination = lazy(
  () => import("./features/safargram/pages/DestinationPostsPage"),
);

// Logged-in page with the standard site chrome.
const Shell = ({ children }) => (
  <ProtectedRoute>
    <div>
      <Navbar />
      <Sidebar />
      {children}
      <Footer />
    </div>
  </ProtectedRoute>
);
const TourBooking = lazy(() => import("./Pages/Booking/TourBooking"));
const Payment = lazy(() => import("./Pages/Payment/Payment"));
const ThankYou = lazy(() => import("./Pages/Thankyou/ThankYou"));
const Blogs = lazy(() => import("./Pages/Blog/Blogs"));
const MyBlog = lazy(() => import("./Pages/Blog/MyBlog"));
const BlogView = lazy(() => import("./Pages/Blog/BlogView"));
const SearchResultList = lazy(
  () => import("./Pages/SearchResultList/SearchResultList"),
);
const TourListing = lazy(() => import("./Pages/Tours/TourListing/TourListing"));
const TourDetail = lazy(() => import("./Pages/Tours/TourDetail/TourDetail"));
const CreateBlog = lazy(() => import("./Pages/Blog/CreateBlog"));
const BlogDetails = lazy(() => import("./Pages/Blog/BlogDetails"));
const DesignShowcase = lazy(() => import("./Pages/Test/DesignShowcase"));
const Profile = lazy(() => import("./Pages/Profile/Profile"));
const BookingHistory = lazy(
  () => import("./Pages/BookingHistory/BookingHistory"),
);

const AppContent = () => {
  // useAuthPersist();
  const [showSplash, setShowSplash] = useState(true);
  const [isAppReady, setIsAppReady] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      dispatch(
        loginSuccess({
          user: JSON.parse(user),
          token,
        }),
      );
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
    <div className="App">
      <Toaster />
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/home" element={<HomePage />} />
            <Route
              path="/auth"
              element={
                <div>
                  <Navbar />
                  <Sidebar />
                  <Auth />
                  <Footer />
                </div>
              }
            />
            <Route
              path="/aboutus"
              element={
                <div>
                  <Navbar />
                  <Sidebar />
                  <AboutUs />
                  <Footer />
                </div>
              }
            />

            <Route path="/contact-Us" element={<Contact />} />
            <Route
              path="/map"
              element={
                <div>
                  <Navbar />
                  <Sidebar />
                  <MapPage />
                  <Footer />
                </div>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/profile/:username?"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <Profile />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/me"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <Profile />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />
            <Route path="/homegram" element={<Navigate to="/safargram" replace />} />
            <Route path="/safargram" element={<Shell><SafarFeed /></Shell>} />
            <Route path="/safargram/explore" element={<Shell><SafarExplore /></Shell>} />
            <Route path="/safargram/saved" element={<Shell><SafarSaved /></Shell>} />
            <Route path="/chat" element={<Shell><ChatPage /></Shell>} />
            <Route path="/chat/with/:username" element={<Shell><ChatPage /></Shell>} />
            <Route path="/chat/:conversationId" element={<Shell><ChatPage /></Shell>} />
            <Route path="/safargram/post/:id" element={<Shell><SafarPost /></Shell>} />
            <Route path="/safargram/tag/:tag" element={<Shell><SafarTag /></Shell>} />
            <Route
              path="/safargram/destination/:id"
              element={<Shell><SafarDestination /></Shell>}
            />

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

            <Route
              path="/blogs"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <Blogs />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/myblog"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <MyBlog />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/create-blog"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <CreateBlog />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/blog/:id"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <BlogView />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/blog-details/:id"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <BlogDetails />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />

            <Route
              path="/booking"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <TourBooking />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />

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

            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <Feedback />
                    <Footer />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* Semi-Protected Routes (View public, actions protected) */}
            <Route
              path="/destinations"
              element={
                <div>
                  <Sidebar />
                  <AllDestinations />
                </div>
              }
            />

            <Route
              path="/destinations/:id"
              element={
                <div>
                  <DestinationDetail />
                </div>
              }
            />

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
        </Suspense>
      </Router>
    </div>
  );
};

function App() {
  return (
    <div>
      <Provider store={store}>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </Provider>
    </div>
  );
}

export default App;
