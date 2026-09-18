import FacebookLogin from '@greatsumini/react-facebook-login';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { facebookLogin } from '../../../actions/authAction';

import { FaFacebook } from "react-icons/fa";

const FacebookLoginButton = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleFacebookLogin = async (response) => {
        try {
            const result = await dispatch(facebookLogin(response.accessToken));
            if (result.success) {
                toast.success('Successfully logged in with Facebook!');
                navigate('/');
            }
        } catch (error) {
            toast.error('Facebook login failed');
        }
    };

    return (
        <FacebookLogin
            appId={import.meta.env.VITE_FACEBOOK_APP_ID}
            onSuccess={handleFacebookLogin}
            onFail={(error) => {
                toast.error('Facebook login failed');
            }}
            className="facebook-login-button"
        >
            <FaFacebook className="icon" />
            Continue with Facebook
        </FacebookLogin>
    );
};

export default FacebookLoginButton;