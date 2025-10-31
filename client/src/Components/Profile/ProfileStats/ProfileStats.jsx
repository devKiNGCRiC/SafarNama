// client/src/components/Profile/ProfileStats/ProfileStats.jsx
import React, { useState, useEffect } from 'react';
import { Users, MapPin, Book, Camera, Award, ThumbsUp } from 'lucide-react';
import './ProfileStats.scss';

const AnimatedCounter = ({ end, duration = 2000 }) => {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
        let startTime;
        let animationFrame;
        
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = (currentTime - startTime) / duration;
            
            if (progress < 1) {
                setCount(Math.floor(end * progress));
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end);
            }
        };
        
        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration]);

    return <span>{count.toLocaleString()}</span>;
};

const ProfileStats = ({ stats }) => {
    const {
        followers,
        following,
        posts,
        tours,
        blogs,
        photos,
        achievements,
        likes
    } = stats;

    const statItems = [
        { 
            icon: Users, 
            label: 'Followers', 
            value: followers,
            color: '#3498db'
        },
        { 
            icon: Users, 
            label: 'Following', 
            value: following,
            color: '#2ecc71'
        },
        { 
            icon: MapPin, 
            label: 'Tours', 
            value: tours,
            color: '#e67e22'
        },
        { 
            icon: Book, 
            label: 'Blogs', 
            value: blogs,
            color: '#9b59b6'
        },
        { 
            icon: Camera, 
            label: 'Photos', 
            value: photos,
            color: '#34495e'
        },
        { 
            icon: Award, 
            label: 'Achievements', 
            value: achievements,
            color: '#f1c40f'
        }
    ];

    return (
        <div className="profile-stats">
            <div className="stats-grid">
                {statItems.map((item, index) => (
                    <div key={index} className="stat-card" style={{'--accent-color': item.color}}>
                        <div className="stat-icon">
                            <item.icon size={24} />
                        </div>
                        <div className="stat-info">
                            <h4>{item.label}</h4>
                            <div className="stat-value">
                                <AnimatedCounter end={item.value} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="engagement-stats">
                <div className="likes-section">
                    <ThumbsUp size={20} />
                    <div className="likes-info">
                        <span><AnimatedCounter end={likes} /> Total Likes</span>
                        <div className="likes-chart">
                            {[...Array(12)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="chart-bar" 
                                    style={{ height: `${Math.random() * 100}%` }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileStats;