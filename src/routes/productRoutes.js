import { Router } from 'express';
import multipart from 'connect-multiparty';

import ProductMiddleware from '../middlewares/productMiddleware';
import ProductController from '../controllers/productController';
import AuthMiddleware from '../middlewares/AuthMiddleware';


const productRouter = Router();
const multipartMiddleware = multipart();

productRouter.post('/', AuthMiddleware.validateToken, multipartMiddleware,
  ...ProductMiddleware.validateCreateProductData(), ProductMiddleware.processImages,
  ProductController.addProduct);

productRouter.delete('/:productId', AuthMiddleware.validateToken, ProductMiddleware.validateProductExists,
  ProductMiddleware.validateUserCanOperateProduct, ProductController.deleteProduct);

productRouter.patch('/:productId', AuthMiddleware.validateToken, multipartMiddleware,
  ProductMiddleware.validateProductExists, ProductMiddleware.validateUserCanOperateProduct,
  ...ProductMiddleware.validateProductUpdateData(), ProductMiddleware.processImages,
  ProductController.updateProduct);


export default productRouter;
