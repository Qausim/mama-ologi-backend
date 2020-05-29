import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import app from '../..';
import jwtUtils from '../../utils/jwtUtils';
import User from '../../models/user';
import cloudinary from '../../config/cloudinaryConfig';
import envVariables from '../../environment';
import {
  internalServerError, productTableName, productNoImageError, emptyTokenError,
  invalidTokenError, productTitleValidationError, productPriceValidationError, 
  productWeightValidationError, productDescriptionValidationError, maxImagesError,
  maxImageSizeAndFormatError, imageUploadError, productDiscountValidationError, productStockValidationError,
} from '../../utils/constants';
import dbConnection from '../../db/dbConnection';
import Product from '../../models/product';


chai.use(chaiHttp);
const { expect } = chai;
const baseUrl = '/api/v1/products';
const splittedDir = __dirname.replace(/[\\]/g, '/').split('/');
const testImagesDir = `${splittedDir.slice(0, splittedDir.length - 3).join('/')}/testImages`;
const fakeCloudinaryBaseUrl = 'https://res.cloudinary.com/qausim/image/upload/v1';
const { adminEmail } = envVariables;
let product;
let productWithImages;
let userToken;
let user;

before((done) => {
  User.findByEmail(adminEmail)
    .then((res) => {
      user = res;
      userToken = jwtUtils.generateToken(user);

      return dbConnection.dbConnect(
        `SELECT * FROM ${productTableName} AS product WHERE array_length(product.images, 1) IS NULL LIMIT 1`
      );
    })
    .then(({ rows }) => {
      product = rows[0];
      return dbConnection.dbConnect(
        `SELECT * FROM ${productTableName} AS product WHERE array_length(product.images, 1)>0 LIMIT 1`
      );
    })
    .then(({ rows }) => {
      productWithImages = rows[0];
      done();
    })
    .catch((e) => done(e));
});

describe(`PATCH ${baseUrl}/:productId`, () => {
  describe('SUCCESS', () => {
    let uploaderStub;
    let cloudApiDeleterStub;
  
    before((done) => {
      uploaderStub = sinon.stub(cloudinary.uploader, 'upload').callsFake((path, options) => {
        return new Promise((resolve) => {
          resolve({ secure_url: `${fakeCloudinaryBaseUrl}/${options.folder}/${options.public_id}` });
        });
      });

      cloudApiDeleterStub = sinon.stub(cloudinary.api, 'delete_resources').resolves('done');
      done();
    });
  
    after((done) => {
      uploaderStub.restore();
      cloudApiDeleterStub.restore();
      done();
    });


    it('should update the title of a product', async () => {
      const newTitle = 'updated title for fake pap';
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', newTitle);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.title).to.equal(newTitle);
      expect(res.body.data.id).to.equal(product.id);
    });

    it('should update the price of a product', async () => {
      const newPrice = (120.5).toFixed(2);
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('price', newPrice);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.price).to.equal(newPrice);
      expect(res.body.data.id).to.equal(product.id);
    });
    
    it('should update the stock of a product', async () => {
      const newStock = 8;
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('stock', newStock);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.stock).to.equal(newStock);
      expect(res.body.data.id).to.equal(product.id);
    });

    it('should update the discount of a product', async () => {
      const newDiscount = 0.33;
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('discount', newDiscount);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.discount).to.equal(newDiscount.toString());
      expect(res.body.data.id).to.equal(product.id);
    });
    
    it('should update the weight of a product', async () => {
      const newWeight = (50).toFixed(2);
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('weight', newWeight);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.weight).to.equal(newWeight);
      expect(res.body.data.id).to.equal(product.id);
    });

    it('should update the description of a product', async () => {
      const newDescription = 'so this is me updating the fake product you get?!';
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('description', newDescription);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.description).to.equal(newDescription);
      expect(res.body.data.id).to.equal(product.id);
    });

    it('should update the product images', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${productWithImages.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .attach('productImages', `${testImagesDir}/camera.jpg`)

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.images).to.have.length(1);
      res.body.data.images.forEach((img) => {
        expect(img).to.be.a('string').and.satisfy(
          (url) => url.startsWith(fakeCloudinaryBaseUrl) && url.includes('camera')
        );
      });
      expect(res.body.data.id).to.equal(productWithImages.id);
      expect(uploaderStub.called).to.be.true;
      // expect(cloudApiDeleterStub.called).to.be.true;
    });
    
    it('should delete an existing product images', async () => {
      const productImages = [
        'https://cloudinary.com/qausim/image/upload/v1/whatelse.png',
        'deleted:https://cloudinary.com/qausim/image/upload/v1/whatelse2.png'
      ];

      const res = await chai.request(app)
        .patch(`${baseUrl}/${productWithImages.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productImages });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'discount',
        'weight', 'description', 'images', 'stock'
      );
      expect(res.body.data.images).to.have.length(1);
      expect(res.body.data.images[0]).to.equal(productImages[0]);
      expect(res.body.data.id).to.equal(productWithImages.id);
      expect(cloudApiDeleterStub.called).to.be.true;
    });
  });

  describe('FAILURE', () => {
    let uploaderStub;
    let cloudApiDeleterStub;
  
    before((done) => {
      uploaderStub = sinon.stub(cloudinary.uploader, 'upload').callsFake((path, options) => {
        return new Promise((resolve) => {
          resolve({ secure_url: `${fakeCloudinaryBaseUrl}/${options.folder}/${options.public_id}` });
        });
      });

      cloudApiDeleterStub = sinon.stub(cloudinary.api, 'delete_resources').resolves('done');
      done();
    });
  
    after((done) => {
      uploaderStub.restore();
      cloudApiDeleterStub.restore();
      done();
    });

    it('should fail to update a product when no token supplied', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'so this should fail');

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal(emptyTokenError);
    });

    it('should fail to update a product when invalid token supplied', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${new Array(5).fill('srw2340kd').join('')}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'this should also fail');

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal(invalidTokenError);
    });

    it('should fail to update a product with an empty title string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === productTitleValidationError;
      });
    });

    it('should fail to update a product with a title string containing only spaces', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', '                 ');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === productTitleValidationError;
      });
    });

    it('should fail to update a product with a title less than 6 characters', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'pap');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === productTitleValidationError;
      });
    });

    it('should fail to update a product with a title less than 6 alphanumeric characters padded with spaces',
      async () => {
        const res = await chai.request(app)
          .patch(`${baseUrl}/${product.id}`)
          .set('Authorization', userToken)
          .set('Content-Type', 'multipart/form-data')
          .field('title', '  pap         ');

        expect(res.status).to.equal(400);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
          const error = errors.find(({ title }) => title);
          return error.title === productTitleValidationError;
        });
      });

    it('should fail to update a product with an empty price string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('price', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === productPriceValidationError;
      });
    });

    it('should fail to update a product with a non-numeric price string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('price', 'ab5');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === productPriceValidationError;
      });
    });
    
    it('should fail to update a product with a empty stock string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('stock', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ stock }) => stock);
        return error.stock === productStockValidationError;
      });
    });
    
    it('should fail to update a product with a negative stock', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('stock', -10);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ stock }) => stock);
        return error.stock === productStockValidationError;
      });
    });
    
    it('should fail to update a product with a non integer stock', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('stock', 2.5);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ stock }) => stock);
        return error.stock === productStockValidationError;
      });
    });
    
    it('should fail to update a product with a negative discount', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('discount', -0.5);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ discount }) => discount);
        return error.discount === productDiscountValidationError;
      });
    });
    
    it('should fail to update a product with an above 1 discount', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('discount', 1.5);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ discount }) => discount);
        return error.discount === productDiscountValidationError;
      });
    });

    it('should fail to update a product with a non-numeric weight string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('weight', 'ab5');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weight }) => weight);
        return error.weight === productWeightValidationError;
      });
    });

    it('should fail to update a product with an empty description string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('description', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === productDescriptionValidationError;
      });
    });

    it('should fail to update a product with a description string containing only spaces', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('description', '    ');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === productDescriptionValidationError;
      });
    });

    it('should fail to update a product with more than 4 image files', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .attach('productImages', `${testImagesDir}/py.png`)
        .attach('productImages', `${testImagesDir}/py2.png`)
        .attach('productImages', `${testImagesDir}/py3.png`)
        .attach('productImages', `${testImagesDir}/camera.jpg`)
        .attach('productImages', `${testImagesDir}/camera2.jpg`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal(maxImagesError);
      expect(uploaderStub.called).to.be.false;
      expect(cloudApiDeleterStub.called).to.be.false;
      
    });

    it('should fail to update a product with a non-jpeg or non-png image', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .attach('productImages', `${testImagesDir}/py.png`)
        .attach('productImages', `${testImagesDir}/drone3.webp`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal(maxImageSizeAndFormatError);
      expect(uploaderStub.called).to.be.false;
      expect(cloudApiDeleterStub.called).to.be.false;
      
    });

    it('should fail to update a product with an image greater than 2mb in size', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .attach('productImages', `${testImagesDir}/jill-heyer.jpg`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal(maxImageSizeAndFormatError);
      expect(uploaderStub.called).to.be.false;
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it('should fail to update an existing product with zero images by image deletion', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${productWithImages.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productImages: ['deleted:https://cloudinary.com/qausim/image/upload/v1/whatelse2.png'] });

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal(productNoImageError);
      expect(cloudApiDeleterStub.called).to.be.false;
    });
    
    it('should fail to update an existing product with more than four images', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${productWithImages.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ productImages: [
          'https://cloudinary.com/qausim/image/upload/v1/whatelse1.png',
          'https://cloudinary.com/qausim/image/upload/v1/whatelse2.png',
          'https://cloudinary.com/qausim/image/upload/v1/whatelse3.png',
          'https://cloudinary.com/qausim/image/upload/v1/whatelse4.png',
          'https://cloudinary.com/qausim/image/upload/v1/whatelse5.png'
        ] });

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal(maxImagesError);
      expect(cloudApiDeleterStub.called).to.be.false;
    });
    
    it('should encounter an error updating product in database', async () => {
      const dbStub = sinon.stub(Product, 'updateProduct').throws(new Error());
      
      const res = await chai.request(app)
      .patch(`${baseUrl}/${product.id}`)
      .set('Authorization', userToken)
      .set('Content-Type', 'multipart/form-data')
        .field('title', 'updating this title should fail, you know, a server error');
        
        expect(res.status).to.equal(500);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('object').and.to.have.property('message');
        expect(res.body.error.message).to.equal(internalServerError);
        expect(dbStub.called).to.be.true;
        dbStub.restore();
      });
      
      it('should encounter an error while uploading images', async () => {
      // Restore previous behaviour of Cloudinary upload API before setting a new stub
      uploaderStub.restore();
      uploaderStub = sinon.stub(cloudinary.uploader, 'upload').throws(new Error());
      
      const res = await chai.request(app)
      .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .attach('productImages', `${testImagesDir}/py.png`);
        
        expect(res.status).to.equal(500);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('object').and.to.have.property('message');
        expect(res.body.error.message).to.equal(imageUploadError);
        expect(uploaderStub.called).to.be.true;
      });
      
      it('should encounter an error while deleting existing product images', async () => {
        cloudApiDeleterStub.restore();
        cloudApiDeleterStub = sinon.stub(cloudinary.api, 'delete_resources').throws(new Error());
        const res = await chai.request(app)
          .patch(`${baseUrl}/${productWithImages.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ productImages: [
            'https://cloudinary.com/qausim/image/upload/v1/whatelse2.png',
            'https://cloudinary.com/qausim/image/upload/v1/whatelse3.png',
            'deleted:https://cloudinary.com/qausim/image/upload/v1/whatelse1.png'
          ] });
  
        expect(res.status).to.equal(500);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('object').and.have.property('message');
        expect(res.body.error.message).to.equal(internalServerError);
        expect(cloudApiDeleterStub.called).to.be.true;
      });
  });
});
