import { configureStore } from '@reduxjs/toolkit';
import  authReducer  from './reducers/authSlice';
import profileSlice from './reducers/profileSlice';

const store = configureStore({
    reducer: {
        auth: authReducer,
        profile: profileSlice
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
            thunk: true
        })
});

export default store;