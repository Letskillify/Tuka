export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ewqgfmrg",
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "tuka_preset",
  uploadUrl: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "ewqgfmrg"}/image/upload`,
  galleryTag: "tuka_gallery", // This tag will be used to list images
};

export const uploadToCloudinary = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", cloudinaryConfig.uploadPreset);
  data.append("tags", cloudinaryConfig.galleryTag); // Tag the image for the gallery

  const uploadUrl = file?.type?.startsWith("video/")
    ? cloudinaryConfig.uploadUrl.replace("/image/", "/video/")
    : cloudinaryConfig.uploadUrl;
  const res = await fetch(uploadUrl, {
    method: "POST",
    body: data,
  });

  if (!res.ok) {
    throw new Error("Upload failed");
  }

  const result = await res.json();
  return result.secure_url;
};
