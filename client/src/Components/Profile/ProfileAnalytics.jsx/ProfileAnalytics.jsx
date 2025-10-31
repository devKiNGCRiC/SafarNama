import React, { useState } from 'react';
import { 
    LineChart, 
    BarChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { 
    TrendingUp, 
    Users, 
    Activity,
    MapPin,
    Camera,
    ThumbsUp,
    Eye
} from 'lucide-react';
import './Analytics.scss';

const Analytics = ({ profileStats }) => {
    const [timeFrame, setTimeFrame] = useState('week');
    const [loading, setLoading] = useState(false);

    const StatCard = ({ title, value, icon, trend, color }) => (
        <div className="stat-card" style={{ '--stat-color': color }}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-info">
                <h3>{title}</h3>
                <div className="stat-value">
                    {value}
                    {trend && (
                        <span className={`trend ${trend > 0 ? 'positive' : 'negative'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h2>Profile Analytics</h2>
                <div className="time-selector">
                    <button 
                        className={timeFrame === 'week' ? 'active' : ''}
                        onClick={() => setTimeFrame('week')}
                    >
                        Week
                    </button>
                    <button 
                        className={timeFrame === 'month' ? 'active' : ''}
                        onClick={() => setTimeFrame('month')}
                    >
                        Month
                    </button>
                    <button 
                        className={timeFrame === 'year' ? 'active' : ''}
                        onClick={() => setTimeFrame('year')}
                    >
                        Year
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard 
                    title="Profile Views"
                    value={profileStats?.views || 0}
                    icon={<Eye size={24} />}
                    trend={profileStats?.viewsTrend}
                    color="#3498db"
                />
                <StatCard 
                    title="Total Followers"
                    value={profileStats?.followers || 0}
                    icon={<Users size={24} />}
                    trend={profileStats?.followersTrend}
                    color="#2ecc71"
                />
                <StatCard 
                    title="Engagement Rate"
                    value={`${profileStats?.engagementRate || 0}%`}
                    icon={<Activity size={24} />}
                    trend={profileStats?.engagementTrend}
                    color="#e67e22"
                />
                <StatCard 
                    title="Total Posts"
                    value={profileStats?.totalPosts || 0}
                    icon={<Camera size={24} />}
                    color="#9b59b6"
                />
            </div>

            <div className="charts-section">
                <div className="chart-container engagement-chart">
                    <h3>Engagement Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={profileStats?.engagementData || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="likes" 
                                stroke="#2ecc71" 
                                activeDot={{ r: 8 }}
                                name="Likes"
                            />
                            <Line 
                                type="monotone" 
                                dataKey="comments" 
                                stroke="#3498db" 
                                activeDot={{ r: 8 }}
                                name="Comments"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-container location-chart">
                    <h3>Top Locations</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={profileStats?.locationData || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="location" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="visits" fill="#2ecc71" name="Visits" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="insights-section">
                <h3>Key Insights</h3>
                <div className="insights-grid">
                    {profileStats?.insights?.map((insight, index) => (
                        <div key={index} className="insight-card">
                            <div className="insight-icon">{getInsightIcon(insight.type)}</div>
                            <div className="insight-content">
                                <h4>{insight.title}</h4>
                                <p>{insight.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const getInsightIcon = (type) => {
    switch (type) {
        case 'engagement': return <ThumbsUp size={24} />;
        case 'location': return <MapPin size={24} />;
        case 'growth': return <TrendingUp size={24} />;
        default: return <Activity size={24} />;
    }
};

export default Analytics;