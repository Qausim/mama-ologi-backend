import { v2 as cloudinary } from 'cloudinary';

import envVariables from '../environment';


const { cloudinaryName, cloudinaryKey, cloudinarySecret } = envVariables;

cloudinary.config({
  cloud_name: cloudinaryName,
  api_key: cloudinaryKey,
  api_secret: cloudinarySecret,
});

export default cloudinary;
