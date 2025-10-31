import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import './NotificationManager.scss';

const NotificationManager = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        // Connect to WebSocket for real-time notifications
        const ws = new WebSocket(process.env.VITE_WS_URL || 'ws://localhost:5000/ws');
        
        ws.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            handleNewNotification(notification);
        };

        return () => ws.close();
    }, []);

    const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const markAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notif => 
                notif.id === notificationId 
                    ? { ...notif, read: true } 
                    : notif
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notif => ({ ...notif, read: true }))
        );
        setUnreadCount(0);
    };

    const NotificationItem = ({ notification }) => {
        const { type, content, timestamp, read } = notification;

        return (
            <div className={`notification-item ${read ? 'read' : ''}`}>
                <div className="notification-content">
                    <div className="notification-icon">
                        {/* Icon based on notification type */}
                        {getNotificationIcon(type)}
                    </div>
                    <div className="notification-text">
                        <p>{content}</p>
                        <span className="timestamp">
                            {formatTimestamp(timestamp)}
                        </span>
                    </div>
                </div>
                {!read && (
                    <button 
                        className="mark-read-btn"
                        onClick={() => markAsRead(notification.id)}
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="notification-manager">
            <button 
                className="notification-trigger"
                onClick={() => setShowNotifications(!showNotifications)}
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="notification-badge">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showNotifications && (
                <div className="notifications-panel">
                    <div className="notifications-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                            <button 
                                className="mark-all-read"
                                onClick={markAllAsRead}
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {notifications.length > 0 ? (
                            notifications.map(notification => (
                                <NotificationItem 
                                    key={notification.id} 
                                    notification={notification}
                                />
                            ))
                        ) : (
                            <div className="no-notifications">
                                <p>No notifications yet</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const getNotificationIcon = (type) => {
    // Return appropriate icon based on notification type
    switch (type) {
        case 'like':
            return <Heart size={20} />;
        case 'comment':
            return <MessageCircle size={20} />;
        case 'follow':
            return <UserPlus size={20} />;
        default:
            return <Bell size={20} />;
    }
};

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = (now - date) / 1000; // diff in seconds

    if (diff < 60) {
        return 'Just now';
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes}m ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours}h ago`;
    } else {
        return date.toLocaleDateString();
    }
};

export default NotificationManager;