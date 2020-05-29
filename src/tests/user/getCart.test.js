import chai from 'chai';
import chaiHttp from 'chai-http';

import dbConnection from '../../db/dbConnection';
import { mockUser } from '../../mock/user.mock';
import User from '../../models/user';
import jwtUtils from '../../utils/jwtUtils';
import app from '../../';
import {
  emptyTokenError, invalidTokenError, internalServerError, userTableName
} from '../../utils/constants';
import Sinon from 'sinon';


chai.use(chaiHttp);
const { expect } = chai;
const cartUrl = '/api/v1/user/cart';
let user;

before((done) => {
  dbConnection.dbConnect(
    `SELECT id from ${userTableName} WHERE email=$1`, [mockUser.email]
  )
    .then(({ rows }) => {
      user = rows[0];
      user.token = jwtUtils.generateToken(user);
      done();
    })
    .catch((error) => done(error));
});

describe(`GET ${cartUrl}`, () => {
  describe('SUCCESS', () => {
    it('should get a user\'s cart', async () => {
      const res = await chai.request(app)
        .get(cartUrl)
        .set('Authorization', 'Bearer ' + user.token)
        .send();
      
      const dbCart = await User.getCart(user.id);
      expect(res.status).to.be.equal(200);
      expect(res.body).to.be.an('object').and.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(dbCart.length);
      const firstInCart = res.body.data[0];
      if (firstInCart) {
        expect(firstInCart).to.be.an('object').and.to.have.keys(
          'quantity', 'product_title', 'product_price',
          'product_id', 'total_price', 'product_weight', 'total_weight'
        );
        Object.keys(firstInCart).forEach((key) => {
          expect(firstInCart[key]).to.equal(dbCart[0][key]);
        });
      }
    });
  });
  
  describe('FAILURE', () => {
    it('should fail to fetch user\s cart due to no token', async () => {
      const res = await chai.request(app)
        .get(cartUrl)
        .send();

      expect(res.status).to.be.equal(401);
      expect(res.body).to.be.an('object').and.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(emptyTokenError);
    });
    
    it('should fail to fetch user\s cart due to invalid token', async () => {
      const res = await chai.request(app)
        .get(cartUrl)
        .set('Authorization', 'Bearer ' + 'dldlddlldl'.repeat(6))
        .send();

      expect(res.status).to.be.equal(401);
      expect(res.body).to.be.an('object').and.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(invalidTokenError);
    });

    it('should fail to fetch user\s cart due to server error', async () => {
      const dbStub = Sinon.stub(User, 'getCart').throws(new Error());
      const res = await chai.request(app)
        .get(cartUrl)
        .set('Authorization', 'Bearer ' + user.token)
        .send();

      expect(res.status).to.be.equal(500);
      expect(res.body).to.be.an('object').and.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(internalServerError);

      dbStub.restore();
    });
  });
})
