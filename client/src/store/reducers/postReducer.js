// Action type constants
const UPLOAD_START = 'UPLOAD_START';
const UPLOAD_SUCCESS = 'UPLOAD_SUCCESS';
const UPLOAD_FAIL = 'UPLOAD_FAIL';

// Initial state with posts as an array
const initialState = {
  posts: [],  // Ensure posts is initialized as an empty array
  loading: false,
  error: false,
  uploading: false
};

// Post reducer
const postReducer = (state = initialState, action) => {
  switch (action.type) {

    case 'UPLOAD_IMAGE_START':
      return { ...state, uploading: true, error: null };

    case 'UPLOAD_IMAGE_SUCCESS':
      console.log("UPLOAD_IMAGE_SUCCESS: Image data received", action.data);
      return { ...state, uploading: false, imageData: action.data };
        
    case 'UPLOAD_IMAGE_FAIL':
      return { ...state, uploading: false, error: action.error };

    case UPLOAD_START:
      console.log("UPLOAD_START: Starting upload...");
      return {
        ...state,
        uploading: true,
        error: false
      };

    case UPLOAD_SUCCESS:
      console.log("UPLOAD_SUCCESS: Upload successful, adding post", action.data);
      // Ensure action.data is a valid object before adding it to posts
      if (!action.data || typeof action.data !== "object") {
        console.error("UPLOAD_SUCCESS received invalid data:", action.data);
        return state; // Return current state if data is invalid
      }

      return {
        ...state,
        posts: [action.data, ...(state.posts || [])],  // Use an empty array if state.posts is undefined
        uploading: false,
        error: false
      };

    case UPLOAD_FAIL:
      console.log("UPLOAD_FAIL: Upload failed");
      return {
        ...state,
        uploading: false,
        error: true
      };

    default:
      return state;
  }
};

export default postReducer;







//     switch (action.type) {
//         case "UPLOAD_START":
//             return { ...state, uploading: true ,  error : false }
//         case "UPLOAD_SUCCESS":
//             return { ...state, posts: [action.data, ...state.posts] ,uploading: false , error : false }
//         case "UPLOAD_FAIL":
//             return { ...state, uploading: false, error: true}
//         default:
//             return state
//     }
// }

// export default postReducer