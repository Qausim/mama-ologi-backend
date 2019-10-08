import { Router } from 'express';
import multipart from 'connect-multiparty';

import ProductMiddleware from '../middlewares/productMiddleware';
import ProductController from '../controllers/productController';
import AuthMiddleware from '../middlewares/AuthMiddleware';


const productRouter = Router();
const multipartMiddleware = multipart();

productRouter.post('/', AuthMiddleware.validateToken, multipartMiddleware,
  ...ProductMiddleware.validateProductData(), ProductMiddleware.processImages,
  ProductController.addProduct);

productRouter.delete('/:productId', AuthMiddleware.validateToken, ProductController.deleteProduct);


export default productRouter;
