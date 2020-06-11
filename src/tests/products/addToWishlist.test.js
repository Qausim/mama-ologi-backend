import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../..';
import { mockUser } from '../../mock/user.mock';
import dbConnection from '../../db/dbConnection';
import jwtUtils from '../../utils/jwtUtils';
import {
  quantityValidationError, internalServerError, productTableName,
  userTableName, emptyTokenError, invalidTokenError, productNotFoundError
} from '../../utils/constants';
import Sinon from 'sinon';
import Product from '../../models/product';

const fixFloat = (num) => parseFloat(num).toFixed(2);


chai.use(chaiHttp);
const { expect } = chai;
const v1Url = `/api/v1`;
const productsUrl = `${v1Url}/products`;
let user;
let product;

before((done) => {
  dbConnection.dbConnect(
    `SELECT * FROM ${productTableName} LIMIT 1`
  )
    .then(({ rows }) => {
      product = rows[0];
      return dbConnection.dbConnect(`SELECT id, email FROM ${userTableName} WHERE email=$1`, [mockUser.email])
    })
    .then(({ rows }) => {
      user = rows[0];
      user.token = jwtUtils.generateToken(user);
      done();
    })
    .catch((error) => done(error));
});

describe(`${productsUrl}/:productId/wishlist`, () => {
  describe('SUCCESS', () => {
    it('should add product to user\'s wishlist', async () => {
      const quantity = 2;
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity });
      
        expect(res.status).to.equal(200);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
        expect(res.body.status).to.equal('success');
        expect(res.body.data).to.be.an('array').and.to.not.be.empty;
        const serverWish = res.body.data.find((wish) => wish.product_id == product.id);
        expect(serverWish).to.be.an('object').and.to.have.keys(
        'quantity', 'total_price', 'total_weight',
        'product_id', 'product_price', 'product_title', 'product_weight'
      );
      expect(serverWish.quantity).to.equal(quantity);
      expect(serverWish.product_title).to.equal(product.title);
      expect(fixFloat(serverWish.product_weight)).to.equal(fixFloat(product.weight));
      expect(fixFloat(serverWish.total_price)).to.equal(fixFloat(parseFloat(product.price) * quantity));
      expect(fixFloat(serverWish.total_weight)).to.equal(fixFloat(parseFloat(product.weight) * quantity));
    });
    
    it('should add update product quantity to maximum in user\'s wishlist', async () => {
      const quantity = 4;
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity });
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array').and.to.not.be.empty;
      const serverWish = res.body.data.find((wish) => wish.product_id == product.id);
      expect(serverWish).to.be.an('object').and.to.have.keys(
        'quantity', 'total_price', 'total_weight',
        'product_id', 'product_price', 'product_title', 'product_weight'
      );
      expect(serverWish.quantity).to.equal(quantity);
      expect(serverWish.product_title).to.equal(product.title);
      expect(fixFloat(serverWish.product_weight)).to.equal(fixFloat(product.weight));
      expect(fixFloat(serverWish.total_price)).to.equal(fixFloat(parseFloat(product.price) * quantity));
      expect(fixFloat(serverWish.total_weight)).to.equal(fixFloat(parseFloat(product.weight) * quantity));
    });
  });

  describe('FAILURE', () => {
    it('should fail to add product to user\'s wishlist due to no token', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist`)
        .send({ quantity: 7 });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal(emptyTokenError);
    });
    
    it('should fail to add product to user\'s wishlist for invalid token', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist`)
        .set('Authorization', 'Bearer ' + 'ldldldld'.repeat(5))
        .send({ quantity: 7 });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal(invalidTokenError);
    });
    
    it('should fail to add product to user\'s wishlist for product that doesn\'t exist', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${500}/wishlist`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity: 7 });

      expect(res.status).to.equal(404);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal(productNotFoundError);
    });
    
    it('should fail to add product to user\'s wishlist with invalid quantity', async () => {
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist`)
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
      const dbStub = Sinon.stub(Product, 'addToWishList').throws(new Error());
      const res = await chai.request(app)
        .post(`${productsUrl}/${product.id}/wishlist`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ quantity: 8 });

      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.have.property('message');
      expect(res.body.error.message).to.equal(internalServerError);
      
      dbStub.restore();
    });
  });
})
