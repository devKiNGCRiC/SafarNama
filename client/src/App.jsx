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
import { NotificationsProvider } from "./features/notifications/NotificationsProvider";
import { BOOKING_ENABLED, ECO_GUIDES_ENABLED, EVENTS_ENABLED, FORUM_ENABLED, GALLERY_ENABLED } from "./config/features";
import RouteEffects from "./Components/Routing/RouteEffects";
import BottomNav from "./Components/BottomNav/BottomNav";
import AdminRoute from "./Components/Routing/AdminRoute";
import RoutedErrorBoundary from "./Components/Routing/RoutedErrorBoundary";

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
const Events = lazy(() => import("./features/events/pages/EventsPage"));
const EventDetail = lazy(() => import("./features/events/pages/EventDetailPage"));
const ManageEvents = lazy(() => import("./features/events/pages/ManageEventsPage"));
const EcoGuides = lazy(() => import("./features/ecoguides/pages/GuidesPage"));
const EcoGuideDetail = lazy(() => import("./features/ecoguides/pages/GuideDetailPage"));
const ManageEcoGuides = lazy(() => import("./features/ecoguides/pages/ManageGuidesPage"));
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
const ForgotPassword = lazy(() => import("./Pages/Auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./Pages/Auth/ResetPassword"));
const NotFound = lazy(() => import("./Pages/NotFound/NotFound"));
const GalleryPage = lazy(() => import("./features/gallery/pages/GalleryPage"));
const GalleryPhotoPage = lazy(() => import("./features/gallery/pages/PhotoPage"));
const ForumPage = lazy(() => import("./features/forum/pages/ForumPage"));
const ForumThreadPage = lazy(() => import("./features/forum/pages/ThreadPage"));
const AdminDashboard = lazy(() => import("./features/admin/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("./features/admin/pages/AdminUsers"));
const AdminReports = lazy(() => import("./features/admin/pages/AdminReports"));
const AdminMessages = lazy(() => import("./features/admin/pages/AdminMessages"));
const AdminDestinations = lazy(() => import("./Pages/Admin/AdminDestinations"));
const AdminDestinationForm = lazy(() => import("./Pages/Admin/DestinationForm"));
const SettingsPage = lazy(() => import("./features/settings/pages/SettingsPage"));
const NotificationsPage = lazy(() => import("./features/notifications/pages/NotificationsPage"));
const SafarDestination = lazy(
  () => import("./features/safargram/pages/DestinationPostsPage"),
);

// Booking pages are only reachable when the feature is switched on.
const BookingGate = ({ children }) =>
  BOOKING_ENABLED ? children : <Navigate to="/home" replace />;

// Admin-only page with the standard site chrome (the page brings its own admin tabs).
const AdminShell = ({ children }) => (
  <AdminRoute>
    <div>
      <Navbar />
      {children}
      <Footer />
    </div>
  </AdminRoute>
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
        <RouteEffects />
        <BottomNav />
        <RoutedErrorBoundary>
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
            <Route path="/me" element={<Navigate to="/profile" replace />} />
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
            
            <Route path="/homegram" element={<Navigate to="/safargram" replace />} />
            <Route path="/safargram" element={<Shell><SafarFeed /></Shell>} />
            <Route path="/safargram/explore" element={<Shell><SafarExplore /></Shell>} />
            <Route path="/safargram/saved" element={<Shell><SafarSaved /></Shell>} />
            <Route path="/notifications" element={<Shell><NotificationsPage /></Shell>} />
            <Route path="/settings" element={<Shell><SettingsPage /></Shell>} />
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
                <BookingGate>
                <ProtectedRoute>
                  <div>
                    <Navbar />
                    <Sidebar />
                    <TourBooking />
                    <Footer />
                  </div>
                </ProtectedRoute>
                </BookingGate>
              }
            />

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

            {/* Admin area (admins only) */}
            <Route path="/admin" element={<AdminShell><AdminDashboard /></AdminShell>} />
            <Route path="/admin/users" element={<AdminShell><AdminUsers /></AdminShell>} />
            <Route path="/admin/reports" element={<AdminShell><AdminReports /></AdminShell>} />
            <Route path="/admin/messages" element={<AdminShell><AdminMessages /></AdminShell>} />
            <Route path="/admin/destinations" element={<AdminShell><AdminDestinations /></AdminShell>} />
            <Route path="/admin/destinations/new" element={<AdminShell><AdminDestinationForm /></AdminShell>} />
            <Route path="/admin/destinations/edit/:id" element={<AdminShell><AdminDestinationForm /></AdminShell>} />
            <Route path="/forum" element={FORUM_ENABLED ? <div><Navbar /><ForumPage /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route path="/forum/:id" element={FORUM_ENABLED ? <div><Navbar /><ForumThreadPage /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route path="/communityforum" element={<Navigate to="/forum" replace />} />
            <Route path="/gallery" element={GALLERY_ENABLED ? <div><Navbar /><GalleryPage /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route path="/gallery/:id" element={GALLERY_ENABLED ? <div><Navbar /><GalleryPhotoPage /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route path="/eco-guides" element={ECO_GUIDES_ENABLED ? <div><Navbar /><EcoGuides /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route path="/eco-guides/:id" element={ECO_GUIDES_ENABLED ? <div><Navbar /><EcoGuideDetail /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route
              path="/admin/eco-guides"
              element={
                ECO_GUIDES_ENABLED ? (
                  <AdminRoute><div><Navbar /><ManageEcoGuides /><Footer /></div></AdminRoute>
                ) : (
                  <Navigate to="/home" replace />
                )
              }
            />
            <Route path="/itinerary" element={<ItineraryBuilder />} />
            <Route path="/events" element={EVENTS_ENABLED ? <div><Navbar /><Events /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route path="/events/:id" element={EVENTS_ENABLED ? <div><Navbar /><EventDetail /><Footer /></div> : <Navigate to="/home" replace />} />
            <Route
              path="/admin/events"
              element={
                EVENTS_ENABLED ? (
                  <AdminRoute><div><Navbar /><ManageEvents /><Footer /></div></AdminRoute>
                ) : (
                  <Navigate to="/home" replace />
                )
              }
            />
            <Route path="/FAQ" element={<FAQ />} />

            <Route path="/tours" element={<TourListing />} />
            <Route path="/tours/:id" element={<TourDetail />} />
            <Route path="/payment" element={<BookingGate><Payment /></BookingGate>} />

            <Route path="/thank-you" element={<BookingGate><ThankYou /></BookingGate>} />
            <Route path="/bookings" element={<BookingGate><BookingHistory /></BookingGate>} />

            {/* Password reset (the emailed link opens /reset-password/:token) */}
            <Route
              path="/forgot-password"
              element={<div><Navbar /><ForgotPassword /><Footer /></div>}
            />
            <Route
              path="/reset-password/:token"
              element={<div><Navbar /><ResetPassword /><Footer /></div>}
            />

            {/* Design System Showcase (Development Only) */}
            <Route path="/design-showcase" element={import.meta.env.DEV ? <DesignShowcase /> : <Navigate to="/home" replace />} />

            {/* <Route path='/tours' element={<Tours />} />
                        <Route path='/tours/:id' element={<TourDetail />} />
                        <Route path='/tours/search' element={<SearchResultList />} />
                        <Route path="/payments" element={<Payment />} />
                        <Route path="/thankyou" element={<ThankYou />} /> */}
            {/* Any other address */}
            <Route path="*" element={<div><Navbar /><NotFound /><Footer /></div>} />
          </Routes>
        </Suspense>
        </RoutedErrorBoundary>
      </Router>
    </div>
  );
};

function App() {
  return (
    <div>
      <Provider store={store}>
        <ChatProvider>
          <NotificationsProvider>
            <AppContent />
          </NotificationsProvider>
        </ChatProvider>
      </Provider>
    </div>
  );
}

export default App;
