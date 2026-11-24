const rawCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const resolvedCloudName = (!rawCloudName || rawCloudName === "dy1g9f3bj") ? "ewqgfmrg" : rawCloudName;

const rawPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const resolvedPreset = (!rawPreset || rawPreset === "tuka_preset") ? "tuka_preset" : rawPreset;

export const cloudinaryConfig = {
    cloudName: resolvedCloudName,
    uploadPreset: resolvedPreset,
    get uploadUrl() {
        return `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    },
    galleryTag: "tuka_gallery", // This tag will be used to list images
};

export const uploadToCloudinary = (file, onProgress) => {
    return new Promise((resolve, reject) => {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", cloudinaryConfig.uploadPreset);
        if (cloudinaryConfig.galleryTag) {
            data.append("tags", cloudinaryConfig.galleryTag);
        }

        const uploadUrl = file?.type?.startsWith("video/")
            ? cloudinaryConfig.uploadUrl.replace("/image/", "/video/")
            : cloudinaryConfig.uploadUrl;

        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);

        if (xhr.upload && onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = Math.round((event.loaded / event.total) * 100);
                    onProgress(percentComplete);
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    resolve(result.secure_url);
                } catch (e) {
                    reject(new Error("Invalid response from Cloudinary"));
                }
            } else {
                let errorMsg = `Upload failed (${xhr.status})`;
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    if (errorData?.error?.message) {
                        errorMsg = errorData.error.message;
                    }
                } catch (_) {}
                reject(new Error(errorMsg));
            }
        };

        xhr.onerror = () => {
            reject(new Error("Network error during Cloudinary upload"));
        };

        xhr.send(data);
    });
};
