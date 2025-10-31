import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { 
    RiHome3Line, 
    RiMapPinLine, 
    RiCompassDiscoverLine,
    RiCommunityLine,
    RiImageLine,
    RiBookReadLine,
    RiSettings4Line,
    RiUserLine,
    RiNotification3Line,
    RiMenuFoldLine,
    RiMenuUnfoldLine,
    RiLogoutCircleLine
} from 'react-icons/ri';
import './Sidebar.css';
import { logoutUser } from '../../actions/authAction';

const Sidebar = () => {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const menuItems = [
        { path: '/', name: 'Home', icon: RiHome3Line },
        // { path: '/map', name: 'Map', icon: RiMapPinLine },
        { path: '/destinations', name: 'Explore', icon: RiCompassDiscoverLine },
        // { path: '/homegram', name: 'SafarGram', icon: RiCommunityLine, protected: true },
        // { path: '/gallery', name: 'Gallery', icon: RiImageLine },
        // { path: '/blogs', name: 'Blogs', icon: RiBookReadLine, protected: true },
    ];

    const bottomMenuItems = [
        // { path: '/notifications', name: 'Notifications', icon: RiNotification3Line, protected: true },
        // { path: '/settings', name: 'Settings', icon: RiSettings4Line, protected: true },
    ];

    const toggleSidebar = () => {
        setIsVisible(!isVisible);
    };

    const handleLogout = () => {
        dispatch(logoutUser());
        toast.success("Logged out successfully");
        setIsVisible(false);
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            <button 
                className={`sidebar-toggle ${isVisible ? 'active' : ''}`}
                onClick = {() => setIsVisible(!isVisible)}
            >
                {isVisible ? <RiMenuFoldLine /> : <RiMenuUnfoldLine />}
            </button>

            {isVisible && (
                <div className="sidebar-overlay" onClick={() => setIsVisible(false)}></div>
            )}

            <div className={`sidebar ${isVisible ? 'visible' : ''}`}>
                <div className="sidebar-content">
                    {/* Profile Section at Top if logged in */}
                    {isAuthenticated && user && (
                        <Link to="/profile" className="menu-item profile-item" onClick={() => setIsVisible(false)}>
                            <div className="profile-info">
                                {user.avatar ? (
                                    <img 
                                        src={user.avatar} 
                                        alt="Profile" 
                                        className="profile-image"
                                    />
                                ) : (
                                    <RiUserLine className="menu-icon" />
                                )}
                                <div>
                                    <div className="profile-name">{user.username || 'User'}</div>
                                    <div className="profile-email">{user.email}</div>
                                </div>
                            </div>
                        </Link>
                    )}

                    <div className="sidebar-menu">
                        {menuItems.map((item) => (
                            (!item.protected || isAuthenticated) && (
                                <Link 
                                    key={item.path} 
                                    to={item.path} 
                                    className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={() => setIsVisible(false)}
                                >
                                    <item.icon className="menu-icon" />
                                    <span className="menu-text">{item.name}</span>
                                </Link>
                            )
                        ))}
                    </div>

                    <div className="sidebar-footer">
                        {bottomMenuItems.map((item) => (
                            (!item.protected || isAuthenticated) && (
                                <Link 
                                    key={item.path} 
                                    to={item.path} 
                                    className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
                                    onClick={() => setIsVisible(false)}
                                >
                                    <item.icon className="menu-icon" />
                                    <span className="menu-text">{item.name}</span>
                                </Link>
                            )
                        ))}
                        
                        {isAuthenticated && (
                            <button className="menu-item" onClick={handleLogout}>
                                <RiLogoutCircleLine className="menu-icon" />
                                <span className="menu-text">Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;