import dotenv from 'dotenv';

dotenv.config();

export default ((process) => ({
  environtment: process.NODE_ENV,
  adminEmail: process.ADMIN_EMAIL,
  adminPassword: process.ADMIN_PASSWORD,
  jwtSecret: process.JWT_SECRET,
  cloudinaryName: process.CLOUDINARY_CLOUD_NAME,
  cloudinaryKey: process.CLOUDINARY_API_KEY,
  cloudinarySecret: process.CLOUDINARY_API_SECRET,
}))(process.env);
