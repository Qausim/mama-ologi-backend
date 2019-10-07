import fs from 'fs';

import cloudinary from '../config/cloudinaryConfig';


/**
 * Defines functions that communicate with the Cloudinary API
 */
export default class CloudinaryService {
  /**
   * Uploads files to the cloudinary cloud service
   * Specifies a unique file url using the user id, original filename and the timestamp
   * while populating an array on the request body for image urls returned by cloudinary
   * @param {object} request
   * @param {callback} next
   */
  static async uploadImages(request, productImages, next) {
    const { user: { userId } } = request;
    try {
      // Loop over and upload each image
      const results = productImages.map(async ({ path, originalFilename }) => {
        // Generate a unique filename using timestamp and original name without the extension
        const splitName = originalFilename.split('.');
        const fileName = `${splitName.slice(0, splitName.length - 1).join('.')}-${new Date().getTime()}`;
        const result = await cloudinary.uploader.upload(path, {
          folder: `mama-ologi/u${userId}`,
          public_id: fileName,
        });
        // Clear image from memory then return result
        fs.unlinkSync(path);
        return result;
      });

      const images = await Promise.all(results);
      // Attach the urls to the images to the request body and proceed to the controller
      request.body.images = images.map((image) => image.secure_url);
      next();
    } catch (error) {
      next(new Error('Error uploading images'));
    }
  }
}
