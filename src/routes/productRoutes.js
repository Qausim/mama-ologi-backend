import { Router } from 'express';
import multipart from 'connect-multiparty';

import ProductMiddleware from '../middlewares/ProductMiddleware';
import ProductController from '../controllers/ProductController';
import AuthMiddleware from '../middlewares/AuthMiddleware';


const productRouter = Router();
const multipartMiddleware = multipart();

productRouter.post('/', AuthMiddleware.validateToken, multipartMiddleware,
  ...ProductMiddleware.validateCreateProductData(), ProductMiddleware.processImages,
  ProductController.addProduct);

productRouter.get('/', ProductController.getProducts);

productRouter.get('/:productId', ProductMiddleware.verifyProductExists, ProductController.getProduct);

productRouter.delete(
  '/:productId', AuthMiddleware.validateToken, ProductMiddleware.verifyProductExists,
  ProductMiddleware.validateUserCanOperateProduct, ProductController.deleteProduct,
);

productRouter.patch(
  '/:productId', AuthMiddleware.validateToken, multipartMiddleware,
  ProductMiddleware.verifyProductExists, ProductMiddleware.validateUserCanOperateProduct,
  ...ProductMiddleware.validateProductUpdateData(), ProductMiddleware.processImages,
  ProductController.updateProduct,
);

productRouter.post(
  '/:productId/wishlist', AuthMiddleware.validateToken,
  ProductMiddleware.verifyProductExists, ProductController.addToWishlist,
);

productRouter.delete(
  '/:productId/wishlist', AuthMiddleware.validateToken,
  ProductMiddleware.verifyProductExists, ProductController.removeFromWishlist,
);

productRouter.post(
  '/:productId/cart', ...ProductMiddleware.validateCartData(),
  AuthMiddleware.validateToken, ProductMiddleware.verifyProductExists, ProductController.addToCart,
);

productRouter.delete(
  '/:productId/cart', AuthMiddleware.validateToken,
  ProductMiddleware.verifyProductExists, ProductController.removeFromCart,
);

export default productRouter;
