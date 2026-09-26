import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import "./Navbar.css";

// Import Logo
import logoSVG from "../../Assets/logo.svg";

// Import Icons
import { AiFillCloseCircle } from "react-icons/ai";
import { PiDotsNineBold } from "react-icons/pi";
import {
  RiRobot2Fill,
  RiNotification3Line,
  RiUserLine,
  RiHome3Line,
  RiMapPinLine,
  RiCompassDiscoverLine,
  RiCameraLine,
  RiChat3Line,
  RiBookOpenLine,
  RiImageLine,
  RiInformationLine,
  RiSettings4Line,
  RiLogoutCircleLine,
  RiLoginCircleLine,
  RiSearchLine,
  RiCalendarEventLine,
  RiCommunityLine,
  RiLeafLine,
} from "react-icons/ri";
import { ECO_GUIDES_ENABLED, EVENTS_ENABLED, FORUM_ENABLED, GALLERY_ENABLED } from "../../config/features";
import { logoutUser } from "../../actions/authAction";
import UnreadBadge from "../../features/chat/components/UnreadBadge";
import NotificationBell, { NotificationCount } from "../../features/notifications/components/NotificationBell";

const ProtectedLink = ({ to, children, onClick }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Please login first to access this page");
      navigate("/auth", { state: { from: { pathname: to } } });
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Link to={to} onClick={handleClick}>
      {children}
    </Link>
  );
};

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const auth = useSelector((state) => state.auth);
  const { user, isAuthenticated } = auth || {};
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Pages that have their own search functionality (hide navbar searchbar)
  const pagesWithSearch = ["/", "/home", "/destinations", "/tours", "/search"];
  const shouldShowSearch = !pagesWithSearch.includes(location.pathname);

  const toggleMobileMenu = (isOpen) => {
    setIsMobileMenuOpen(isOpen);
    // document.body.classList.toggle('menu-open', isOpen);
    if (isOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/destinations?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      toggleMobileMenu(false);
    }
  };

  return (
    <div className="navBarWrapper">
      <div className="navBar">
        {/* Logo Section */}
        <div className="navBarLogo">
          <Link to="/">
            <img src={logoSVG} className="logoimg" alt="SafarNama Logo" />
            <span className="first">
              Safar<span className="second">Nama</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navBarDesktop">
          <ul className="navLinks">
            <li>
              <Link to="/home">Home</Link>
            </li>
            <li>
              <Link to="/destinations">Destination</Link>
            </li>
            {EVENTS_ENABLED && (
              <li>
                <Link to="/events">Events</Link>
              </li>
            )}
            {ECO_GUIDES_ENABLED && (
              <li>
                <Link to="/eco-guides">Eco-Guides</Link>
              </li>
            )}
            {GALLERY_ENABLED && (
              <li>
                <Link to="/gallery">Gallery</Link>
              </li>
            )}
            {FORUM_ENABLED && (
              <li>
                <Link to="/forum">Forum</Link>
              </li>
            )}
            <li>
              <Link to="/aboutus">About-Us</Link>
            </li>
            <li>
              <ProtectedLink to="/blogs">Blog</ProtectedLink>
            </li>
            <li>
              <ProtectedLink to="/safargram">SafarGram</ProtectedLink>
            </li>
            <li>
              <ProtectedLink to="/chat">
                Chat
                <UnreadBadge />
              </ProtectedLink>
            </li>
          </ul>

          {shouldShowSearch && (
            <form className="searchBar" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">
                <RiSearchLine className="icon" />
              </button>
            </form>
          )}

          <div className="navActions">
            {isAuthenticated && <NotificationBell />}
            {!isAuthenticated && (
              <Link to="/auth" className="signUpBtn">
                Sign Up
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="mobileControls">
          <PiDotsNineBold
            className="menuIcon"
            onClick={() => toggleMobileMenu(true)}
          />
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`mobileMenuOverlay ${isMobileMenuOpen ? "show" : ""}`}
          onClick={() => toggleMobileMenu(false)}
        />

        {/* Mobile Menu */}
        <div className={`mobileMenu ${isMobileMenuOpen ? "show" : ""}`}>
          <div className="mobileMenuContent">
            {isAuthenticated && user && (
              <div className="userProfile">
                <div className="avatarContainer">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" />
                  ) : (
                    <RiUserLine className="avatarIcon" />
                  )}
                </div>
                <div className="userInfo">
                  <h3>{user?.username || "User"}</h3>
                  <p>{user?.email}</p>
                </div>
              </div>
            )}

            <form className="mobileSearch" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit">
                <RiSearchLine className="icon" />
              </button>
            </form>

            <nav className="mobileNav">
              <Link to="/" onClick={() => toggleMobileMenu(false)}>
                <RiHome3Line className="icon" />
                Home
              </Link>
              <Link to="/map" onClick={() => toggleMobileMenu(false)}>
                <RiMapPinLine className="icon" />
                Map
              </Link>
              <Link to="/destinations" onClick={() => toggleMobileMenu(false)}>
                <RiCompassDiscoverLine className="icon" />
                Destinations
              </Link>
              {FORUM_ENABLED && (
                <Link to="/forum" onClick={() => toggleMobileMenu(false)}>
                  <RiCommunityLine className="icon" />
                  Forum
                </Link>
              )}
              {GALLERY_ENABLED && (
                <Link to="/gallery" onClick={() => toggleMobileMenu(false)}>
                  <RiImageLine className="icon" />
                  Gallery
                </Link>
              )}
              {ECO_GUIDES_ENABLED && (
                <Link to="/eco-guides" onClick={() => toggleMobileMenu(false)}>
                  <RiLeafLine className="icon" />
                  Eco-Guides
                </Link>
              )}
              {EVENTS_ENABLED && (
                <Link to="/events" onClick={() => toggleMobileMenu(false)}>
                  <RiCalendarEventLine className="icon" />
                  Events
                </Link>
              )}
              <Link to="/aboutus" onClick={() => toggleMobileMenu(false)}>
                <RiInformationLine className="icon" />
                About Us
              </Link>
              <ProtectedLink
                to="/safargram"
                onClick={() => toggleMobileMenu(false)}
              >
                <RiCameraLine className="icon" />
                SafarGram
              </ProtectedLink>
              <ProtectedLink to="/chat" onClick={() => toggleMobileMenu(false)}>
                <RiChat3Line className="icon" />
                Chat
                <UnreadBadge />
              </ProtectedLink>
              <ProtectedLink to="/notifications" onClick={() => toggleMobileMenu(false)}>
                <RiNotification3Line className="icon" />
                Notifications
                <NotificationCount />
              </ProtectedLink>
              <ProtectedLink
                to="/blogs"
                onClick={() => toggleMobileMenu(false)}
              >
                <RiBookOpenLine className="icon" />
                Blog
              </ProtectedLink>
            </nav>

            <div className="mobileActions">

              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      navigate(`/profile/${user.username}`);
                      toggleMobileMenu(false);
                    }}
                  >
                    <RiUserLine className="icon" />
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/settings");
                      toggleMobileMenu(false);
                    }}
                  >
                    <RiSettings4Line className="icon" />
                    Settings
                  </button>
                  <button className="logoutBtn" onClick={handleLogout}>
                    <RiLogoutCircleLine className="icon" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="signUpBtn"
                  onClick={() => toggleMobileMenu(false)}
                >
                  <RiLoginCircleLine className="icon" />
                  Sign Up / Login
                </Link>
              )}
            </div>
          </div>

          <button className="closeBtn" onClick={() => toggleMobileMenu(false)}>
            <AiFillCloseCircle className="icon" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
