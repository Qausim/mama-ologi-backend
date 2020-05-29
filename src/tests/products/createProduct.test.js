import chai from 'chai';
import chaiHttp from 'chai-http';
import { v2 as cloudinary } from 'cloudinary';
import sinon from 'sinon';

import app from '../..';
import jwtUtils from '../../utils/jwtUtils';
import envVariables from '../../environment';
import { mockProduct1 } from '../../mock/product.mock';
import {
  internalServerError, productCreationError, emptyTokenError, invalidTokenError,
  productTitleValidationError, productPriceValidationError, productWeightValidationError,
  productDescriptionValidationError, maxImagesError, maxImageSizeAndFormatError, imageUploadError, productStockValidationError, productDiscountValidationError,
} from '../../utils/constants';
import User from '../../models/user';
import Product from '../../models/product';
import { mockUser } from '../../mock/user.mock';

chai.use(chaiHttp);
const { expect } = chai;
const url = '/api/v1/products';
const { adminEmail } = envVariables;
let admin;
let adminToken;
let user;
const data = mockProduct1;

const splittedDir = __dirname.replace(/[\\]/g, '/').split('/');
const testImagesDir = `${splittedDir.slice(0, splittedDir.length - 3).join('/')}/testImages`;
const fakeCloudinaryBaseUrl = 'https://res.cloudinary.com/qausim/image/upload/v1';


describe(`POST ${url}`, () => {
  let uploaderStub;

  before((done) => {
    User.findByEmail(adminEmail)
      .then((res) => {
        admin = res;
        adminToken = jwtUtils.generateToken(admin);
        return User.findByEmail(mockUser.email);
      })
      .then((res) => {
        user = res;
        user.token = jwtUtils.generateToken(user);
      })
      .then(() => {
        uploaderStub = sinon.stub(cloudinary.uploader, 'upload').callsFake((path, options) => {
          return new Promise((resolve) => {
            resolve({ secure_url: `${fakeCloudinaryBaseUrl}/${options.folder}/${options.public_id}` });
          });
        });
        done();
      }).catch((error) => done(error));
  });

  after((done) => {
    uploaderStub.restore();
    done();
  });

  describe('SUCCESS', () => {
    const image = `${testImagesDir}/py.png`;

    it('should create a product with an image', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description)
        .attach('productImages', image);

      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'discount', 'stock', 'deleted'
      );
      expect(res.body.data.owner_id).to.eql(admin.id.toString());
      expect(res.body.data.description).to.be.a('string');
      expect(res.body.data.price).to.equal(data.price.toString());
      expect(res.body.data.weight).to.equal(data.weight.toString());
      expect(res.body.data.stock).to.equal(data.stock)
      expect(res.body.data.images).to.be.an('array').and.to.have.length(1);
      expect(res.body.data.images[0]).to.be.a('string').and.satisfy((url) => url.startsWith(fakeCloudinaryBaseUrl));
      expect(uploaderStub.called).to.be.true;
    });

    it('should create a product without an image', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'discount', 'stock', 'deleted'
      );
      expect(res.body.data.owner_id).to.equal(admin.id.toString());
      expect(res.body.data.description).to.be.a('string');
      expect(res.body.data.price).to.equal(data.price.toString());
      expect(res.body.data.weight).to.equal(data.weight.toString());
      expect(res.body.data.stock).to.equal(data.stock)
      expect(res.body.data.images).to.be.an('array').and.to.be.empty;
    });
  });

  describe('FAILURE', () => {
    it('should fail to create a product by a non-admin', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', `Bearer ${user.token}`)
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal(productCreationError);
    });

    it('should fail to create a product when no token supplied', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal(emptyTokenError);
    });

    it('should fail to create a product when invalid token supplied', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', `Bearer ${new Array(5).fill('srw2340kd').join('')}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal(invalidTokenError);
    });

    it('should fail to create a product without a title field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === productTitleValidationError;
      });
    });

    it('should fail to create a product with an empty title string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', '')
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === productTitleValidationError;
      });
    });

    it('should fail to create a product with a title string containing only spaces', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', '                 ')
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === productTitleValidationError;
      });
    });

    it('should fail to create a product with a title less than 6 characters', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title.slice(0, 5))
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === productTitleValidationError;
      });
    });

    it('should fail to create a product with a title less than 6 alphanumeric characters padded with spaces',
      async () => {
        const res = await chai.request(app)
          .post(url)
          .set('Authorization', adminToken)
          .set('Content-Type', 'multipart/form-data')
          .field('title', `${data.title.slice(0, 5)}         `)
          .field('price', data.price)
          .field('weight', data.weight)
          .field('stock', data.stock)
          .field('description', data.description);

        expect(res.status).to.equal(400);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
          const error = errors.find(({ title }) => title);
          return error.title === productTitleValidationError;
        });
      });

    it('should fail to create a product without a price field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === productPriceValidationError;
      });
    });

    it('should fail to create a product with a empty price string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', '')
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === productPriceValidationError;
      });
    });

    it('should fail to create a product with a non-numeric price string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', 'ab5')
        .field('weight', data.weight)
        .field('stock', data.stock) 
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === productPriceValidationError;
      });
    });
    
    it('should fail to create a product without a stock field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('weight', data.weight)
        .field('price', data.price)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ stock }) => stock);
        return error.stock === productStockValidationError;
      });
    });

    it('should fail to create a product with a empty stock string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', '')
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ stock }) => stock);
        return error.stock === productStockValidationError;
      });
    });

    it('should fail to create a product with a negative integer stock field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', -5) 
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ stock }) => stock);
        return error.stock === productStockValidationError;
      });
    });
     
    it('should fail to create a product with a non-integer stock field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', 2.5) 
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ stock }) => stock);
        return error.stock === productStockValidationError;
      });
    });

    it('should fail to create a product without a weight field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weight }) => weight);
        return error.weight === productWeightValidationError;
      });
    });

    it('should fail to create a product with a non-numeric weight string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', 'ab5')
        .field('stock', data.stock)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weight }) => weight);
        return error.weight === productWeightValidationError;
      });
    });

    it('should fail to create a product with a negative discount field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('discount', -0.5)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ discount }) => discount);
        return error.discount === productDiscountValidationError;
      });
    });
     
    it('should fail to create a product with a discount value above 1', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('discount', 1.5)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ discount }) => discount);
        return error.discount === productDiscountValidationError;
      });
    });

    it('should fail to create a product without a description field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === productDescriptionValidationError;
      });
    });

    it('should fail to create a product with an empty description string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === productDescriptionValidationError;
      });
    });

    it('should fail to create a product with an description string containing only spaces', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', '    ');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === productDescriptionValidationError;
      });
    });

    it('should fail to upload more than 4 image files', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description)
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
    });

    it('should fail to upload a non-jpeg or non-png image', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/py.png`)
        .attach('productImages', `${testImagesDir}/drone3.webp`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal(maxImageSizeAndFormatError);
    });

    it('should fail to upload an image greater than 2mb in size', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/jill-heyer.jpg`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal(maxImageSizeAndFormatError);
    });

    it('should encounter an error saving new product in database', async () => {
      const dbStub = sinon.stub(Product.prototype, 'save').throws(new Error());

      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/py.png`);
        
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
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('stock', data.stock)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/py.png`);

      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal(imageUploadError);
    });
  });
})
