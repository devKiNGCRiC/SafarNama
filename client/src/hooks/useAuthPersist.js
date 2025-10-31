import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/reducers/authSlice';

export const useAuthPersist = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
            try {
                dispatch(loginSuccess({
                    token,
                    user: JSON.parse(user),
                    authType: 'local'
                }));
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, [dispatch]);
};