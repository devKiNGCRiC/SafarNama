// client/src/utils/imageUpload.js
export const handleImageUpload = async (file, type, uploadFunction) => {
    if (!file) return null;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPG or PNG)');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size should not exceed 5MB');
    }

    const formData = new FormData();
    formData.append(type, file); // type should be 'avatar' or 'cover'

    return await uploadFunction(formData);
};