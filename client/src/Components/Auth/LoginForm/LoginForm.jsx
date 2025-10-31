import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../../../actions/authAction';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import './LoginForm.scss';

// Import Icons
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordLine , RiUserLine } from 'react-icons/ri';

const LoginForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.auth);
    
    const [formData, setFormData] = useState({
        userIdentifier: '', // This will store either email or username
        // email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    //const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // if (!formData.email) {
        //     newErrors.email = 'Email is required';
        // } else if (!emailRegex.test(formData.email)) {
        //     newErrors.email = 'Invalid email format';
        // }

        if (!formData.userIdentifier) {
            newErrors.userIdentifier = 'Email or username is required';
        } else if (formData.userIdentifier.includes('@') && !emailRegex.test(formData.userIdentifier)) {
            newErrors.userIdentifier = 'Invalid email format';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            // setLoading(true);
            try {
                console.log('Attempting login with:', formData); // Debug log

                const response = await dispatch(loginUser({
                    userIdentifier: formData.userIdentifier,
                    password: formData.password,
                    rememberMe
                }));

                console.log('Login response:', response); // Debug log

                if (response.success) {
                    toast.success('Successfully logged in!');
                    navigate('/'); // or your desired redirect path
                } else {
                    setErrors({ submit: response.error || 'Login failed' });
                    toast.error(response.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error); // Debug log
            setErrors({ submit: error.message || 'An error occurred during login' });
                toast.error('An error occurred during login');
            }
        }
    };

    return (
        <div className="loginForm">
            <form onSubmit={handleSubmit} className="loginForm__container">
                <div className="loginForm__field">
                    <div className="loginForm__input">
                    {formData.userIdentifier.includes('@') ? 
                            <MdEmail className="icon" /> : 
                            <RiUserLine className="icon" />
                        }
                        <input
                            type="text"
                            name="userIdentifier"
                            placeholder="Email or Username"
                            value={formData.userIdentifier}
                            onChange={handleChange}
                            className={errors.userIdentifier ? 'error' : ''}
                            autoComplete="username"
                        />
                    </div>
                    {errors.userIdentifier && (
                        <span className="loginForm__error">{errors.userIdentifier}</span>
                    )}
                </div>

                <div className="loginForm__field">
                    <div className="loginForm__input">
                        <RiLockPasswordLine className="icon" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="showPassword"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? 
                                <AiOutlineEyeInvisible className="icon" /> : 
                                <AiOutlineEye className="icon" />
                            }
                        </button>
                    </div>
                    {errors.password && <span className="loginForm__error">{errors.password}</span>}
                </div>

                <div className="loginForm__options">
                    <label className="loginForm__remember">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Remember me</span>
                    </label>
                    <Link to="/forgot-password" className="loginForm__forgot">
                        Forgot Password?
                    </Link>
                </div>

                <button 
                    type="submit" 
                    className="loginForm__submit"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>

                {errors.submit && (
                    <div className="loginForm__submitError">
                        {errors.submit}
                    </div>
                )}
            </form>
        </div>
    );
};

export default LoginForm;