import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../..';
import User from '../../models/user';
import { mockUser } from '../../mock/user.mock';
import jwtUtils from '../../utils/jwtUtils';
import {
  emptyTokenError, invalidTokenError, productNotFoundError, internalServerError
} from '../../utils/constants';
import Product from '../../models/product';


const fixFloat = (num) => num.toFixed(2);

chai.use(chaiHttp);
const { expect } = chai;
const deleteFromWishlistBaseUrl = '/api/v1/products';
let user;
let products;
let userToken;

before((done) => {
  User.findByEmail(mockUser.email)
    .then((res) => {
      user = res;
      userToken = jwtUtils.generateToken(user);
      return Product.getPaginatedList(1);
    })
    .then((list) => {
      products = list.slice(0, 2);
      return Promise.all(
        products.map(async(product) => await Product.addToWishList(user.id, product.id, 2))
      );
    })
    .then(() => done())
    .catch((error) => done(error));
});


describe(`DELETE ${deleteFromWishlistBaseUrl}`, () => {
  describe('SUCCESS', () => {
    it('should delete from a user\s wishlist successfully', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromWishlistBaseUrl}/${products[0].id}/wishlist`)
        .set('Authorization', 'Bearer ' + userToken)
        .send();

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array').and.to.have.length(1);
      expect(res.body.data[0]).to.be.an('object').and.to.have.keys(
        'product_id', 'product_price', 'product_title',
        'product_weight', 'discount', 'stock'
      );
      expect(res.body.data[0].product_id).to.equal(parseInt(products[1].id));
      expect(res.body.data[0].product_title).to.equal(products[1].title);
      expect(res.body.data[0].stock).to.equal(products[1].stock);
      expect(fixFloat(res.body.data[0].product_price)).to.equal(products[1].price);
      expect(fixFloat(res.body.data[0].product_weight)).to.equal(products[1].weight);
      expect(fixFloat(res.body.data[0].discount, 10)).to.equal(products[1].discount);
    });
  });

  describe('FAILURE', () => {
    it('should fail to delete from a user\s wishlist when token no set', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromWishlistBaseUrl}/${products[1].id}/wishlist`)
        .send();

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(emptyTokenError);
    });
    
    it('should fail to delete from a user\s wishlist when invalid token is set', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromWishlistBaseUrl}/${products[1].id}/wishlist`)
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
        .delete(`${deleteFromWishlistBaseUrl}/500/wishlist`)
        .set('Authorization', 'Bearer ' + userToken)
        .send();
      
      expect(res.status).to.equal(404);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.keys('message');
      expect(res.body.error.message).to.equal(productNotFoundError);
    });
    
    it('should fail to delete from a user\s a product that doesn\'t exist in the wishlist', async() => {
      const res = await chai.request(app)
        .delete(`${deleteFromWishlistBaseUrl}/${products[0].id}/wishlist`)
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
