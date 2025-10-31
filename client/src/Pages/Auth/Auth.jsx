import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Auth.scss';

// Import Icons
import { FcGoogle } from "react-icons/fc";
import { FaFacebookF } from "react-icons/fa";
import { AiFillInstagram } from "react-icons/ai";
import { BsTwitterX, BsThreads, BsTelegram } from "react-icons/bs";

// Import Logo
import Logo from '../../Assets/logo.jpg';

// Import Components
import LoginForm from '../../Components/Auth/LoginForm/LoginForm';
import RegisterForm from '../../Components/Auth/RegisterForm/RegisterForm';
import GoogleLogin from '../../Components/Auth/SocialAuth/GoogleLogin';
import FacebookLoginButton from '../../Components/Auth/SocialAuth/FacebookLogin';
import { loginSuccess } from '../../store/reducers/authSlice';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const dispatch = useDispatch();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            dispatch(loginSuccess({
                token,
                user: JSON.parse(user)
            }));
        }
    }, []);
    // const { loading } = useSelector((state) => state.authReducer);

    // const toggleForm = () => {
    //     setIsSignUp(!isSignUp);
    // };

    return (
        <div className="auth">
            {/* Left Section */}
            <div className="auth__left">
                <div className="auth__logo">
                    <img src={Logo} alt="SafarNama Logo" />
                    <h1 className='safar'>Safar<span className='nama'>Nama</span></h1>
                </div>

                <div className="auth__intro">
                    <h2 className='welcome'>Welcome to Your Travel Community</h2>
                    <p className='message'>Connect with fellow travelers, share your experiences, and explore new destinations together.</p>
                </div>

                <div className="auth__social">
                    <h3 className='connect'>Connect With Us</h3>
                    <div className="social-links">
                        <a href="https://www.facebook.com/profile.php?id=61567204745011" target="_blank" rel="noopener noreferrer" className='slinks'>
                            <FaFacebookF className="icon facebook" />
                        </a>
                        <a href="https://www.instagram.com/safarnama_rkcbharat" target="_blank" rel="noopener noreferrer" className='slinks'>
                            <AiFillInstagram className="icon instagram" />
                        </a>
                        <a href="https://x.com/Safarnama_RKC" target="_blank" rel="noopener noreferrer" className='slinks'>
                            <BsTwitterX className="icon twitter" />
                        </a>
                        <a href="https://www.threads.net/@safarnama_rkcbharat?invite=0" target="_blank" rel="noopener noreferrer" className='slinks'>
                            <BsThreads className="icon threads" />
                        </a>
                        <a href="https://t.me/SafarNama_RKCBharat" target="_blank" rel="noopener noreferrer" className='slinks'>
                            <BsTelegram className="icon telegram" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Right Section */}
            <div className="auth__right">
                <div className="auth__form-container">
                    <div className="form-switch">
                        <button 
                            className={!isSignUp ? 'active' : ''} 
                            onClick={() => setIsSignUp(false)}
                        >
                            Sign In
                        </button>
                        <button 
                            className={isSignUp ? 'active' : ''} 
                            onClick={() => setIsSignUp(true)}
                        >
                            Sign Up
                        </button>
                    </div>

                    {isSignUp ? <RegisterForm /> : <LoginForm />}

                    {/* <div className="social-auth">
                        <div className="divider">
                            <span>or continue with</span>
                        </div>
                        
                        <div className="social-buttons">
                            <GoogleLogin />
                            <FacebookLoginButton />
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    );
};

export default Auth;