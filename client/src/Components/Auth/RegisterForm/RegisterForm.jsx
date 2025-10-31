import React, { useState } from 'react';
import { useDispatch , useSelector  } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../../actions/authAction';
import toast from 'react-hot-toast';
import './RegisterForm.scss';

// Import Icons
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { RiLockPasswordLine, RiUserLine } from 'react-icons/ri';
import { MdEmail, MdPerson } from 'react-icons/md';

const RegisterForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState({
        password: false,
        confirmPassword: false
    });

    const [errors, setErrors] = useState({});
    //const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        // Clear error when user types
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }

        // Check password strength if password field
        if (name === 'password') {
            checkPasswordStrength(value);
        }
    };

    const checkPasswordStrength = (password) => {
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 1;
        
        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        setPasswordStrength(strength);
    };

    const validateForm = () => {
        const newErrors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

        // Name validations
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        }

        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        }

        // Username validation
        if (!formData.username) {
            newErrors.username = 'Username is required';
        } else if (!usernameRegex.test(formData.username)) {
            newErrors.username = 'Username must be 3-20 characters and can only contain letters, numbers, and underscores';
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (passwordStrength < 3) {
            newErrors.password = 'Password is too weak';
        }

        // Confirm password validation
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            //setLoading(true);
            // Handle registration logic here
            try {
                console.log('Submitting registration form:', formData);
                const response = await dispatch(registerUser({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    username: formData.username,
                    email: formData.email,
                    password: formData.password
                }));

                console.log('Registration response:', response);

                if (response.success) {
                    toast.success('Registration successful!');
                    setTimeout(() => {
                        navigate('/auth', { replace: true }); // redirect to login // Add replace: true
                    }, 1000);
                } else {
                    const errorMessage = response.error || 'Registration failed';
                    setErrors({ submit: errorMessage });
                    toast.error(errorMessage);
                }
            } catch (error) {
                console.error('Registration error:', error);
                const errorMessage = error?.message || 'An error occurred during registration';
                setErrors({ submit: errorMessage });
                toast.error(errorMessage);
            }
        }
    };

    return (
        <div className="registerForm">
            <form onSubmit={handleSubmit} className="registerForm__container">
                {/* Name Fields */}
                <div className="registerForm__nameFields">
                    <div className="registerForm__field">
                        <div className="registerForm__input">
                            <MdPerson className="icon" />
                            <input
                                type="text"
                                name="firstName"
                                placeholder="First Name"
                                value={formData.firstName}
                                onChange={handleChange}
                                className={errors.firstName ? 'error' : ''}
                            />
                        </div>
                        {errors.firstName && (
                            <span className="registerForm__error">{errors.firstName}</span>
                        )}
                    </div>

                    <div className="registerForm__field">
                        <div className="registerForm__input">
                            <MdPerson className="icon" />
                            <input
                                type="text"
                                name="lastName"
                                placeholder="Last Name"
                                value={formData.lastName}
                                onChange={handleChange}
                                className={errors.lastName ? 'error' : ''}
                            />
                        </div>
                        {errors.lastName && (
                            <span className="registerForm__error">{errors.lastName}</span>
                        )}
                    </div>
                </div>

                {/* Username Field */}
                <div className="registerForm__field">
                    <div className="registerForm__input">
                        <RiUserLine className="icon" />
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            className={errors.username ? 'error' : ''}
                        />
                    </div>
                    {errors.username && (
                        <span className="registerForm__error">{errors.username}</span>
                    )}
                </div>

                {/* Email Field */}
                <div className="registerForm__field">
                    <div className="registerForm__input">
                        <MdEmail className="icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            className={errors.email ? 'error' : ''}
                        />
                    </div>
                    {errors.email && (
                        <span className="registerForm__error">{errors.email}</span>
                    )}
                </div>

                {/* Password Fields */}
                <div className="registerForm__passwordFields">
                    <div className="registerForm__field">
                        <div className="registerForm__input">
                            <RiLockPasswordLine className="icon" style={{fontSize:"2rem"}}/>
                            <input
                                type={showPassword.password ? 'text' : 'password'}
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className={errors.password ? 'error' : ''}
                            />
                            <button
                                type="button"
                                className="registerForm__togglePassword"
                                onClick={() => setShowPassword({
                                    ...showPassword,
                                    password: !showPassword.password
                                })}
                            >
                                {showPassword.password ? 
                                    <AiOutlineEyeInvisible className="icon" style={{fontSize:"1.2rem"}}/> : 
                                    <AiOutlineEye className="icon" style={{fontSize:"1.2rem"}}/>
                                }
                            </button>
                        </div>
                        {errors.password && (
                            <span className="registerForm__error">{errors.password}</span>
                        )}
                    </div>

                    <div className="registerForm__field">
                        <div className="registerForm__input">
                            <RiLockPasswordLine className="icon" style={{fontSize:"2rem"}}/>
                            <input
                                type={showPassword.confirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={errors.confirmPassword ? 'error' : ''}
                            />
                            <button
                                type="button"
                                className="registerForm__togglePassword"
                                onClick={() => setShowPassword({
                                    ...showPassword,
                                    confirmPassword: !showPassword.confirmPassword
                                })}
                            >
                                {showPassword.confirmPassword ? 
                                    <AiOutlineEyeInvisible className="icon" style={{fontSize:"1.2rem"}}/> : 
                                    <AiOutlineEye className="icon" style={{fontSize:"1.2rem"}}/>
                                }
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <span className="registerForm__error">{errors.confirmPassword}</span>
                        )}
                    </div>
                </div>

                {/* Password strength indicator moves below both password fields */}
                {passwordStrength > 0 && (
                    <div className="registerForm__passwordStrength">
                        <div className="strengthBar">
                            {[...Array(5)].map((_, index) => (
                                <div
                                    key={index}
                                    className={`strengthSegment ${index < passwordStrength ? 'active' : ''}`}
                                />
                            ))}
                        </div>
                        <span className="strengthText">
                            {passwordStrength < 2 ? 'Weak' : 
                            passwordStrength < 4 ? 'Medium' : 'Strong'}
                        </span>
                    </div>
                )}

                <button 
                    type="submit" 
                    className="registerForm__submit"
                    disabled={loading}
                >
                    {loading ? 'Creating Account...' : 'Create Account'}
                </button>

                {errors.submit && (
                    <div className="registerForm__submitError">
                        {errors.submit}
                    </div>
                )}
            </form>
        </div>
    );
};

export default RegisterForm;