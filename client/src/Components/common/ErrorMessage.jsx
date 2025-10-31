import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import './ErrorMessage.scss';

const ErrorMessage = ({ message, onRetry }) => {
    return (
        <div className="error-container">
            <AlertTriangle size={40} className="error-icon" />
            <h3>Oops! Something went wrong</h3>
            <p>{message || 'An error occurred. Please try again.'}</p>
            {onRetry && (
                <button onClick={onRetry} className="retry-button">
                    <RefreshCcw size={16} />
                    Try Again
                </button>
            )}
        </div>
    );
};

export default ErrorMessage;