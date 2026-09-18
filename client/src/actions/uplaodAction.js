import * as UploadApi from '../api/UploadRequest';

export const uploadImage = (data) => async (dispatch) => {
    dispatch({type : 'UPLOAD_IMAGE_START'})
    try {
        const responce = await UploadApi.uploadImage(data)
        dispatch({type : 'UPLOAD_IMAGE_SUCCESS', data : responce.data})
    } catch (error) {
        console.log(error)
        dispatch({type : 'UPLOAD_IMAGE_FAIL'})
    }
}

export const uploadPost = (data) => async (dispatch) => {
    dispatch({ type: 'UPLOAD_START' })
    try {
        const newPost = await UploadApi.uploadPost(data)
        dispatch({ type: 'UPLOAD_SUCCESS', data: newPost.data })
    } catch (error) {
        console.log(error)
        dispatch({ type: 'UPLOAD_FAIL' })
    }
}