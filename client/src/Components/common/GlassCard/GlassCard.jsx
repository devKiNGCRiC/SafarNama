import React from 'react';
import './GlassCard.scss';

const GlassCard = ({ 
    children, 
    className = '', 
    hover = true,
    onClick,
    style = {}
}) => {
    return (
        <div 
            className={`glass-card ${hover ? 'glass-card-hover' : ''} ${className}`}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    );
};

export default GlassCard;
