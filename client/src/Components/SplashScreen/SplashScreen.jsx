import React, { useEffect, useState } from 'react';
import './SplashScreen.scss';
import logo from '../../Assets/logo.jpg';

const SplashScreen = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        // Start fade out after 2 seconds
        const fadeTimeout = setTimeout(() => {
            setFadeOut(true);
        }, 2000);

        // Call onFinish callback
        const finishTimeout = setTimeout(() => {
            onFinish();
        }, 2500);

        return () => {
            clearTimeout(fadeTimeout);
            clearTimeout(finishTimeout);
        };
    }, [onFinish]);

    return (
        <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
            {/* Gradient Background */}
            <div className="splash-bg">
                <div className="gradient-overlay"></div>
            </div>

            {/* Content */}
            <div className="splash-content">
                {/* Logo */}
                <div className="logo-container">
                    <img src={logo} alt="SafarNama" className="splash-logo" />
                </div>

                {/* Brand Name */}
                <div className="brand-name">
                    <h1>
                        <span className="safar">Safar</span><span className="nama">Nama</span>
                    </h1>
                    <p className="tagline">🇮🇳 Your Gateway to Eco-Tourism</p>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;
