import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './reducers/authSlice';
// import { postReducer } from './reducers/postReducer';
// import { forumPostReducer } from './reducers/ForumPostReducer';
// Import other reducers as needed

const store = configureStore({
    reducer: {
        auth: authReducer,
        // post: postReducer,
        // forumPost: forumPostReducer,
        // Add other reducers here
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false
        }),
    devTools: process.env.NODE_ENV !== 'production'
});

export default store;