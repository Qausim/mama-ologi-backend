import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../..';
import { mockUser } from '../../mock/auth.mock';
import dbConnection from '../../db/dbConnection';
import { userTableName } from '../../db/migration';
import envVariables from '../../environment';
import { mockProduct1 } from '../../mock/product.mock';
import jwtUtils from '../../utils/jwtUtils';
import Products from '../../db/products';
import Users from '../../db/users';
import { hashPassword } from '../../utils/authUtils';
import { quantityValidationError, internalServerError } from '../../utils/constants';
import Sinon from 'sinon';


chai.use(chaiHttp);
const { expect } = chai;
const { adminEmail, adminPassword } = envVariables;
const v1Url = `/api/v1`;
const productsUrl = `${v1Url}/products`;
let user;
let product;

before((done) => {
  Products.addProduct({ body: mockProduct1, user: { userId: 1 } })
    .then(({ rows }) => {
    product = rows[0];
    return hashPassword(mockUser.password)
  })
  .then((password) => {
    const [first, rest] = mockUser.email.split('@');
    const email = [first + 199, rest].join('@');
    return dbConnection.dbConnect(
      `INSERT INTO ${userTableName} (
        email, password, first_name, last_name, address, street, phone, state, country
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
        ) ON CONFLICT(email) DO UPDATE SET email=excluded.email RETURNING *`,
      [
        email, password, mockUser.firstName, mockUser.lastName,
        mockUser.address, mockUser.street, mockUser.phone, mockUser.state, mockUser.country
      ]);
  })
  .then(({ rows }) => {
    user = rows[0];
    user.token = jwtUtils.generateToken(user);
    done();
  })
  .catch((error) => done(error));
});

describe(`${productsUrl}/:productId/wishlist-add`, () => {
  describe('SUCCESS', () => {
    it('should add product to user\'s wishlist', async () => {
      const quantity = 2;
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist-add`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array').and.to.have.length(1);
      expect(res.body.data[0]).to.be.an('object').and.to.have.keys(
        'quantity', 'title', 'total_price', 'total_weight');
      expect(res.body.data[0].quantity).to.equal(quantity);
      expect(res.body.data[0].title).to.equal(product.title);
      expect(res.body.data[0].total_price).to.equal((parseFloat(product.price) * quantity).toFixed(2));
      expect(res.body.data[0].total_weight).to.equal((parseFloat(product.weight) * quantity).toFixed(2));
    });
    
    it('should add update product quantity to maximum in user\'s wishlist', async () => {
      const quantity = 4;
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist-add`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array').and.to.have.length(1);
      expect(res.body.data[0]).to.be.an('object').and.to.have.keys(
        'quantity', 'title', 'total_price', 'total_weight');
      expect(res.body.data[0].quantity).to.equal(quantity);
      expect(res.body.data[0].title).to.equal(product.title);
      expect(res.body.data[0].total_price).to.equal((parseFloat(product.price) * quantity).toFixed(2));
      expect(res.body.data[0].total_weight).to.equal((parseFloat(product.weight) * quantity).toFixed(2));
    });
  });

  describe('FAILURE', () => {
    it('should fail to add product to user\'s wishlist due to no token', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist-add`)
        .send({ quantity: 7 });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal('You need to be signed in to perform this operation');
    });
    
    it('should fail to add product to user\'s wishlist for invalid token', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist-add`)
        .set('Authorization', 'Bearer ' + 'ldldldld'.repeat(5))
        .send({ quantity: 7 });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal('Unauthorized operation, please sign in and try again');
    });
    
    it('should fail to add product to user\'s wishlist for product that doesn\'t exist', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${500}/wishlist-add`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity: 7 });

      expect(res.status).to.equal(404);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal('Product not found');
    });
    
    it('should fail to add product to user\'s wishlist with invalid quantity', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist-add`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity: 2.5 });

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.have.property('quantity');
      expect(res.body.error[0].quantity).to.equal(quantityValidationError);
    });
    
    it('should fail to add product to user\'s wishlist due to error in controller', async () => {
      const dbStub = Sinon.stub(Products, 'addToWishlist').throws(new Error());
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist-add`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity: 8 });

      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal(internalServerError);
    });
  });
})
