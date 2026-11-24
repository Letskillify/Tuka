import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../components/Firebase";
import { uploadToCloudinary } from "../config/cloudinary";

/**
 * Uploads a file (image or video) with automatic fallback and progress tracking:
 * 1. Tries Cloudinary first (unrestricted file size & fast global CDN)
 * 2. If Cloudinary fails, falls back to Firebase Storage
 * 
 * @param {File} file 
 * @param {string} folder 
 * @param {Function} onProgress (percent: number) => void
 * @returns {Promise<string>} public download URL
 */
export const uploadMediaFile = async (file, folder = "homepage", onProgress = null) => {
  if (!file) throw new Error("No file provided");

  // Attempt Cloudinary first
  try {
    const cloudinaryUrl = await uploadToCloudinary(file, onProgress);
    if (cloudinaryUrl) return cloudinaryUrl;
  } catch (cloudinaryErr) {
    console.warn("Cloudinary upload failed, attempting Firebase Storage fallback:", cloudinaryErr.message);

    // Attempt Firebase Storage fallback
    if (storage) {
      try {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storageRef = ref(storage, `${folder}/${Date.now()}_${safeName}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              if (onProgress && snapshot.totalBytes > 0) {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                onProgress(progress);
              }
            },
            (error) => reject(new Error("Firebase Storage upload failed: " + error.message)),
            async () => {
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
              } catch (urlErr) {
                reject(urlErr);
              }
            }
          );
        });
      } catch (fbErr) {
        throw new Error(`Upload failed on both Cloudinary (${cloudinaryErr.message}) and Firebase Storage (${fbErr.message})`);
      }
    } else {
      throw new Error(`Cloudinary upload failed: ${cloudinaryErr.message}`);
    }
  }
};

