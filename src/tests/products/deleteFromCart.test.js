import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../';
import Products from '../../db/products';
import Users from '../../db/users';
import { mockUser } from '../../mock/user.mock';
import jwtUtils from '../../utils/jwtUtils';
import {
  emptyTokenError, invalidTokenError, productNotFoundError, internalServerError
} from '../../utils/constants';


const fixFloat = (num) => num.toFixed(2);

chai.use(chaiHttp);
const { expect } = chai;
const deleteFromCartBaseUrl = '/api/v1/products';
let user;
let products;
let userToken;

before((done) => {
  Users.getUser(mockUser.email)
    .then(({ rows }) => {
      user = rows[0];
      userToken = jwtUtils.generateToken(user);
      return Products.getProducts(1);
    })
    .then(({ rows }) => {
      products = rows.slice(0, 2);
      return Promise.all(
        products.map(async(product) => await Products.addToCart(user.id, product.id, 2))
      );
    })
    .then(() => done())
    .catch((error) => done(error));
});


describe(`DELETE ${deleteFromCartBaseUrl}`, () => {
  describe('SUCCESS', () => {
    it('should delete from a user\s cart successfully', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromCartBaseUrl}/${products[0].id}/cart`)
        .set('Authorization', 'Bearer ' + userToken)
        .send();

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array').and.to.have.length(1);
      expect(res.body.data[0]).to.be.an('object').and.to.have.keys(
        'quantity', 'total_price', 'total_weight',
        'product_id', 'product_price', 'product_title', 'product_weight'
      );
      expect(res.body.data[0].product_id).to.equal(parseInt(products[1].id));
      expect(res.body.data[0].product_title).to.equal(products[1].title);
      expect(fixFloat(res.body.data[0].product_price)).to.equal(products[1].price);
      expect(fixFloat(res.body.data[0].product_weight)).to.equal(products[1].weight);
    });
  });

  describe('FAILURE', () => {
    it('should fail to delete from a user\s cart when token no set', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromCartBaseUrl}/${products[1].id}/cart`)
        .send();

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(emptyTokenError);
    });
    
    it('should fail to delete from a user\s cart when invalid token is set', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromCartBaseUrl}/${products[1].id}/cart`)
        .set('Authorization', 'Bearer ' + 'dldldldl'.repeat(6))
        .send();
      
      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(invalidTokenError);
    });
    
    it('should fail to delete from a user\s a product that doesn\'t exist in the DB', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromCartBaseUrl}/500/cart`)
        .set('Authorization', 'Bearer ' + userToken)
        .send();
      
      expect(res.status).to.equal(404);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(productNotFoundError);
    });
    
    it('should fail to delete from a user\s a product that doesn\'t exist in the cart', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromCartBaseUrl}/${products[0].id}/cart`)
        .set('Authorization', 'Bearer ' + userToken)
        .send();
      
      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(internalServerError);
    });
  });
});

