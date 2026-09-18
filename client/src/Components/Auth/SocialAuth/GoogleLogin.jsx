import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleLogin } from '../../../actions/authAction';

import { FcGoogle } from "react-icons/fc";

const GoogleLogin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const login = useGoogleLogin({
        onSuccess: async (response) => {
            try {
                const result = await dispatch(googleLogin(response.access_token));
                if (result.success) {
                    toast.success('Successfully logged in with Google!');
                    navigate('/');
                }
            } catch (error) {
                toast.error('Google login failed');
            }
        },
        onError: () => toast.error('Google login failed')
    });

    return (
        <button onClick={() => login()} className="google-login-button">
            <FcGoogle className="icon" />
            Continue with Google
        </button>
    );
};

export default GoogleLogin;