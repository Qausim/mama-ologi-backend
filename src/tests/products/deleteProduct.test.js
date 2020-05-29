import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import cloudinary from '../../config/cloudinaryConfig';

import app from '../..';
import jwtUtils from '../../utils/jwtUtils';
import User from '../../models/user';
import envVariables from '../../environment';
import {
  internalServerError, productTableName, emptyTokenError, invalidTokenError, productNotFoundError
} from '../../utils/constants';
import dbConnection from '../../db/dbConnection';
import { productWithImages, productWithoutImages } from '../../mock/product.mock';
import Product from '../../models/product';


chai.use(chaiHttp);
const { expect } = chai;
const baseUrl = '/api/v1/products';
const { adminEmail } = envVariables;
let user;
let userToken;

before((done) => {
  User.findByEmail(adminEmail)
    .then((res) => {
      user = res;
      userToken = jwtUtils.generateToken(user);
      done();
    })
    .catch((e) => done(e));
});

describe(`DELETE ${baseUrl}/:productId`, () => {
  describe('SUCCESS', () => {
    let localProduct;
    let localProductWithImages;
    let cloudApiDeleterStub;

    before((done) => {
      dbConnection.dbConnect(
        `
          INSERT INTO ${productTableName} (
            owner_id, title, price, weight, description, images
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          ), (
            $1, $7, $8, $9, $10, $11
          ) RETURNING *;  
        `, 
        [
          user.id, productWithImages.title, productWithImages.price, productWithImages.weight,
          productWithImages.description, productWithImages.images, productWithoutImages.title,
          productWithoutImages.price, productWithoutImages.weight, productWithoutImages.description,
          productWithoutImages.images,
        ]
      )
      .then(({ rows }) => {
        [localProductWithImages, localProduct] = rows;
        cloudApiDeleterStub = sinon.stub(cloudinary.api, 'delete_resources').resolves('done');
        done();
      })
      .catch((e) => done(e));
    });

    // Restore Cloudinary API default behaviour after all tests
    after((done) => {
      cloudApiDeleterStub.restore();
      done();
    });

    it('should delete a product without images successfully', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/${localProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object').and.to.have.keys('message');
      expect(res.body.data.message).to.equal(`"${localProduct.title}" successfully deleted`);
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it('should delete a product with images successfully', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/${localProductWithImages.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object').and.to.have.keys('message');
      expect(res.body.data.message).to.equal(`"${localProductWithImages.title}" successfully deleted`);
      expect(cloudApiDeleterStub.called).to.be.true;
    });
  });


  describe('FAILURE', () => {
    let localProduct;
    let localProductWithImages;
    let cloudApiDeleterStub;

    // Insert an image without images and one with images, and stub Cloudinary API before all tests
    before((done) => {
      dbConnection.dbConnect(
        `
          INSERT INTO ${productTableName} (
            owner_id, title, price, weight, description, images
          ) VALUES (
            $1, $2, $3, $4, $5, $6
          ), (
            $1, $7, $8, $9, $10, $11
          ) RETURNING *;  
        `,
        [
          user.id, productWithImages.title, productWithImages.price, productWithImages.weight,
          productWithImages.description, productWithImages.images, productWithoutImages.title,
          productWithoutImages.price, productWithoutImages.weight, productWithoutImages.description,
          productWithoutImages.images,
      ])
      .then(({ rows }) => {
        [localProductWithImages, localProduct] = rows;
        cloudApiDeleterStub = sinon.stub(cloudinary.api, 'delete_resources').throws(new Error('Unable to delete images'));
        done();
      })
      .catch((e) => done(e));
    });

    // Delete inserted test products from db and restore Cloudinary API default behaviour after all tests
    after((done) => {
      cloudApiDeleterStub.restore();
      done();
    });

    it('should fail to delete a product with no token provided', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/${localProduct.id}`)
        .send();

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(emptyTokenError);
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it('should fail to delete a product with invalid token provided', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/${localProduct.id}`)
        .set('Authorization', `Bearer ${new Array(5).fill('kk4jcm').join('')}`)
        .send();

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(invalidTokenError);
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it('should fail to delete a product when a non-existent product id is provided', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/100000`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(res.status).to.equal(404);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(productNotFoundError);
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it("should fail to delete a product when id of the requester is not same with the product owner's",
      async () => {
        const differentUserToken = jwtUtils.generateToken({ id: 3, email: 'fake@gmail.com' })
        const res = await chai.request(app)
          .delete(`${baseUrl}/${localProduct.id}`)
          .set('Authorization', `Bearer ${differentUserToken}`)
          .send();

        expect(res.status).to.equal(409);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('object').and.to.have.keys('message');
        expect(res.body.error.message).to.equal('You are not permitted to perform this operation on the product');
        expect(cloudApiDeleterStub.called).to.be.false;
    });

    it('should fail to delete a product when its images were not deleted successfully', async () => {
        const res = await chai.request(app)
          .delete(`${baseUrl}/${localProductWithImages.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send();

        const intendedProduct = await Product.findById(localProductWithImages.id);
        expect(res.status).to.equal(500);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('object').and.to.have.keys('message');
        expect(res.body.error.message).to.equal(internalServerError);
        expect(intendedProduct).to.not.be.null;
        expect(cloudApiDeleterStub.called).to.be.true;
    });
  });
})
