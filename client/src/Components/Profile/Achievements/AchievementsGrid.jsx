// client/src/components/Profile/ProfileTabs/AchievementsGrid.jsx
import React from 'react';
import { Award, Trophy, Target, Compass, Camera, ThumbsUp } from 'lucide-react';
import './AchievementsGrid.scss';

const AchievementsGrid = ({ achievements = [] }) => {
    const getAchievementIcon = (type) => {
        switch (type) {
            case 'explorer': return Target;
            case 'photographer': return Camera;
            case 'influencer': return ThumbsUp;
            case 'adventurer': return Compass;
            case 'expert': return Trophy;
            default: return Award;
        }
    };

    const calculateProgress = (current, target) => {
        return (current / target) * 100;
    };

    return (
        <div className="achievements-container">
            <div className="achievements-header">
                <div className="total-score">
                    <Trophy size={32} />
                    <div className="score-info">
                        <h3>Total Score</h3>
                        <p>{achievements.reduce((acc, curr) => acc + curr.points, 0)} points</p>
                    </div>
                </div>
                <div className="rank-badge">
                    <span>Eco Explorer</span>
                    <small>Level 12</small>
                </div>
            </div>

            <div className="achievements-grid">
                {achievements.map((achievement) => {
                    const Icon = getAchievementIcon(achievement.type);
                    const progress = calculateProgress(achievement.current, achievement.target);

                    return (
                        <div 
                            key={achievement._id} 
                            className={`achievement-card ${achievement.unlocked ? 'unlocked' : ''}`}
                        >
                            <div className="achievement-icon">
                                <Icon size={24} />
                            </div>
                            <div className="achievement-info">
                                <h4>{achievement.title}</h4>
                                <p>{achievement.description}</p>
                                <div className="progress-bar">
                                    <div 
                                        className="progress" 
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <div className="progress-text">
                                    <span>{achievement.current} / {achievement.target}</span>
                                    <span>{achievement.points} points</span>
                                </div>
                            </div>
                            {achievement.unlocked && (
                                <div className="achievement-badge">
                                    <Trophy size={16} />
                                    Unlocked!
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="upcoming-achievements">
                <h3>Next Challenges</h3>
                <div className="upcoming-grid">
                    {achievements
                        .filter(a => !a.unlocked)
                        .slice(0, 3)
                        .map((achievement) => {
                            const Icon = getAchievementIcon(achievement.type);
                            return (
                                <div key={achievement._id} className="upcoming-card">
                                    <Icon size={20} />
                                    <div className="upcoming-info">
                                        <h4>{achievement.title}</h4>
                                        <p>{achievement.points} points</p>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </div>
        </div>
    );
};

export default AchievementsGrid;