import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import cloudinary from '../../config/cloudinaryConfig';

import app from '../..';
import Products from '../../db/products';
import jwtUtils from '../../utils/jwtUtils';
import Users from '../../db/users';
import envVariables from '../../environment';


chai.use(chaiHttp);
const { expect } = chai;
const baseUrl = '/api/v1/products';
const { adminEmail } = envVariables;
let user;
let userToken;

before((done) => {
  Users.getUser(adminEmail)
    .then(({ rows }) => {
      [user] = rows;
      userToken = jwtUtils.generateToken(user);
      done();
    })
    .catch((e) => done(e));
});

describe(`DELETE ${baseUrl}/:productId`, () => {
  describe('SUCCESS', () => {
    let product;
    let productWithImages;
    let cloudApiDeleterStub;

    // Insert an image without images and one with images, and stub Cloudinary API before all tests
    before((done) => {
      Products.addProduct({
        body: {
          title: 'fake pap',
          ownerId: user.id,
          price: '1900',
          priceDenomination: 'USD',
          weight: 20,
          weightUnit: 'g',
          description: 'This is fake! You heard?! This is fake!!!',
          images: []
        },
        user: { userId: user.id }
      })
      .then(({ rows }) => {
        product = rows[0];
        return Products.addProduct({
          body: {
            title: 'fake pap with images',
            ownerId: user.id,
            price: '1900',
            priceDenomination: 'USD',
            weight: 20,
            weightUnit: 'g',
            description: 'This is fake! You heard?! This is fake!!!',
            images: ['fake-image1.png', 'fake-image2.png'],
          },
          user: { userId: user.id }
        });
      })
      .then(({ rows }) => {
        productWithImages = rows[0];
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
        .delete(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object').and.to.have.keys('message');
      expect(res.body.data.message).to.equal(`"${product.title}" successfully deleted`);
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it('should delete a product with images successfully', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/${productWithImages.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send();

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object').and.to.have.keys('message');
      expect(res.body.data.message).to.equal(`"${productWithImages.title}" successfully deleted`);
      expect(cloudApiDeleterStub.called).to.be.true;
    });
  });


  describe('FAILURE', () => {
    let product;
    let productWithImages;
    let cloudApiDeleterStub;

    // Insert an image without images and one with images, and stub Cloudinary API before all tests
    before((done) => {
      Products.addProduct({
        body: {
          title: 'fake pap',
          ownerId: user.id,
          price: '1900',
          priceDenomination: 'USD',
          weight: 20,
          weightUnit: 'g',
          description: 'This is fake! You heard?! This is fake!!!',
          images: []
        },
        user: { userId: user.id }
      })
        .then(({ rows }) => {
          product = rows[0];
          return Products.addProduct({
            body: {
              title: 'fake pap with images',
              ownerId: user.id,
              price: '1900',
              priceDenomination: 'USD',
              weight: 20,
              weightUnit: 'g',
              description: 'This is fake! You heard?! This is fake!!!',
              images: ['fake-image1.png', 'fake-image2.png'],
            },
            user: { userId: user.id }
          });
        })
        .then(({ rows }) => {
          productWithImages = rows[0];
          cloudApiDeleterStub = sinon.stub(cloudinary.api, 'delete_resources').throws(new Error('Unable to delete images'));
          done();
        })
        .catch((e) => done(e));
    });

    // Delete inserted test products from db and restore Cloudinary API default behaviour after all tests
    after((done) => {
      cloudApiDeleterStub.restore();
      Products.deleteProduct(product.id)
        .then(() => Products.deleteProduct(productWithImages.id))
        .then(() => done())
        .catch((e) => done(e));
    });

    it('should fail to delete a product with no token provided', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/${product.id}`)
        .send();

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal('You need to be signed in to perform this operation');
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it('should fail to delete a product with invalid token provided', async () => {
      const res = await chai.request(app)
        .delete(`${baseUrl}/${product.id}`)
        .set('Authorization', `Bearer ${new Array(5).fill('kk4jcm').join('')}`)
        .send();

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal('Unauthorized operation, please sign in and try again');
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
      expect(res.body.error.message).to.equal('Product not found');
      expect(cloudApiDeleterStub.called).to.be.false;
    });

    it("should fail to delete a product when id of the requester is not same with the product owner's",
      async () => {
        const differentUserToken = jwtUtils.generateToken({ id: 3, email: 'fake@gmail.com' })
        const res = await chai.request(app)
          .delete(`${baseUrl}/${product.id}`)
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
          .delete(`${baseUrl}/${productWithImages.id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send();

        const intendedProduct = await Products.getProduct(productWithImages.id);
        expect(res.status).to.equal(500);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('object').and.to.have.keys('message');
        expect(res.body.error.message).to.equal('Internal server error');
        expect(intendedProduct).to.not.be.null;
        expect(cloudApiDeleterStub.called).to.be.true;
    });
  });
})
