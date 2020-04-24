import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import app from '../..';
import jwtUtils from '../../utils/jwtUtils';
import Users from '../../db/users';
import Products from '../../db/products';
import cloudinary from '../../config/cloudinaryConfig';
import envVariables from '../../environment';
import { internalServerError } from '../../utils/constants';


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
  Users.getUser(adminEmail)
    .then(({ rows }) => {
      [user] = rows;
      userToken = jwtUtils.generateToken(user);

      return Products.addProduct({
        body: {
          title: 'fake pap',
          ownerId: user.id,
          price: '1900',
          priceDenomination: 'USD',
          weight: (20).toFixed(2),
          weightUnit: 'g',
          description: 'This is fake! You heard?! This is fake!!!',
          images: []
        },
        user: { userId: user.id }
      });
    })
    .then(({ rows }) => {
      product = rows[0];
      return Products.addProduct({
        body: {
          title: 'fake pap with images',
          ownerId: user.id,
          price: '1900',
          priceDenomination: 'USD',
          weight: (20).toFixed(2),
          weightUnit: 'g',
          description: 'This is fake! You heard?! This is fake!!!',
          images: ['fake-image1.png', 'fake-image2.png'],
        },
        user: { userId: user.id }
      });
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
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
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
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
      expect(res.body.data.price).to.equal(newPrice);
      expect(res.body.data.id).to.equal(product.id);
    });

    it('should update the title and price of a product', async () => {
      const newTitle = 'updated title for fake pap the second time';
      const newPrice = (130.5).toFixed(2);
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', newTitle)
        .field('price', newPrice);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
      expect(res.body.data.title).to.equal(newTitle);
      expect(res.body.data.price).to.equal(newPrice);
      expect(res.body.data.id).to.equal(product.id);
    });

    it('should update the priceDenomination of a product', async () => {
      const newDenomination = 'NGN';
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('priceDenomination', newDenomination);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
      expect(res.body.data.price_denomination).to.equal(newDenomination);
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
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
      expect(res.body.data.weight).to.equal(newWeight);
      expect(res.body.data.id).to.equal(product.id);
    });

    it('should update the weightUnit of a product', async () => {
      const newWeightUnit = 'kg';
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('weightUnit', newWeightUnit);

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
      expect(res.body.data.weight_unit).to.equal(newWeightUnit);
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
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
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
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
      expect(res.body.data.images).to.have.length(1);
      res.body.data.images.forEach((img) => {
        expect(img).to.be.a('string').and.satisfy((url) => url.startsWith(fakeCloudinaryBaseUrl) && url.includes('camera'));
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
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
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
      expect(res.body.error.message).to.be.equal('You need to be signed in to perform this operation');
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
      expect(res.body.error.message).to.be.equal('Unauthorized operation, please sign in and try again');
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
        return error.title === 'Please enter a valid title for the product (at least 6 characters)';
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
        return error.title === 'Please enter a valid title for the product (at least 6 characters)';
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
        return error.title === 'Please enter a valid title for the product (at least 6 characters)';
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
          return error.title === 'Please enter a valid title for the product (at least 6 characters)';
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
        return error.price === 'Please enter a valid price (numeric) for the product';
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
        return error.price === 'Please enter a valid price (numeric) for the product';
      });
    });

    it('should fail to update a product with an empty priceDenomination string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('priceDenomination', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ priceDenomination }) => priceDenomination);
        return error.priceDenomination === 'Please choose a denomination for the price';
      });
    });

    it('should fail to update a product with a priceDenomination string containing only spaces', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('priceDenomination', '        ');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ priceDenomination }) => priceDenomination);
        return error.priceDenomination === 'Please choose a denomination for the price';
      });
    });

    it('should fail to update a product with a priceDenomination string besides "NGN" and "USD"', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('priceDenomination', 'GHC');
  
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ priceDenomination }) => priceDenomination);
        return error.priceDenomination === 'Please choose a denomination for the price';
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
        return error.weight === 'Please enter a valid weight (numeric) value for the product';
      });
    });

    it('should fail to update a product with an empty weightUnit string', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('weightUnit', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weightUnit }) => weightUnit);
        return error.weightUnit === 'Please choose unit for the weight, "g" or "kg"';
      });
    });

    it('should fail to update a product with a weightUnit string containing only spaces', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('weightUnit', '      ');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weightUnit }) => weightUnit);
        return error.weightUnit === 'Please choose unit for the weight, "g" or "kg"';
      });
    });

    it('should fail to update a product with a weightUnit string besides "g" and "kg"', async () => {
      const res = await chai.request(app)
        .patch(`${baseUrl}/${product.id}`)
        .set('Authorization', userToken)
        .set('Content-Type', 'multipart/form-data')
        .field('weightUnit', 'lb');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weightUnit }) => weightUnit);
        return error.weightUnit === 'Please choose unit for the weight, "g" or "kg"';
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
        return error.description === "Please provide the product's description";
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
        return error.description === "Please provide the product's description";
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
      expect(res.body.error.message).to.equal('Maximum of 4 image files allowed');
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
      expect(res.body.error.message).to.equal('Only jpeg and png images, each not greater than 2mb, are allowed');
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
      expect(res.body.error.message).to.equal('Only jpeg and png images, each not greater than 2mb, are allowed');
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
      expect(res.body.error.message).to.equal('There must be at least one image for a product');
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
      expect(res.body.error.message).to.equal('Maximum of 4 image files allowed');
      expect(cloudApiDeleterStub.called).to.be.false;
    });
    
    it('should encounter an error updating product in database', async () => {
      const dbStub = sinon.stub(Products, 'updateProduct').throws(new Error());
      
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
        expect(res.body.error.message).to.equal('Error uploading images');
        expect(uploaderStub.called).to.be.true;
      });
      
      it('should an error while deleting existing product images', async () => {
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
