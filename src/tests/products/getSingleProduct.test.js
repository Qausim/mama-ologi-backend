import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import app from '../..';
import Products from '../../db/products';


const { expect } = chai;
chai.use(chaiHttp);
const baseUrl = '/api/v1/products';
let product;

before((done) => {
  Products.getProducts()
    .then((products) => {
      [product, ] = products;
      done();
    })
    .catch((e) => done(e));
});


describe(`GET ${baseUrl}`, () => {
  describe('SUCCESS', () => {
    it('should get a single product', async () => {
      const res = await chai.request(app)
        .get(`${baseUrl}/${product.id}`)
        .send();
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.keys('id', 'ownerId', 'title', 'price', 'weight',
        'description', 'images');
      expect(res.body.data.id).to.be.a('number');
      expect(res.body.data.description).to.be.a('string');
      expect(res.body.data.price).to.be.an('object').and.to.have.keys('value', 'denomination');
      expect(res.body.data.price.value).to.equal(product.price.value);
      expect(res.body.data.price.denomination).to.equal(product.price.denomination);
      expect(res.body.data.weight).to.be.an('object').and.to.have.keys('value', 'unit');
      expect(res.body.data.weight.value).to.equal(product.weight.value);
      expect(res.body.data.weight.unit).to.equal(product.weight.unit);
      expect(res.body.data.images).to.be.an('array').and.to.have.length(product.images.length);
    });
  });

  describe('FAILURE', () => {
    it("should fail to retrieve a product that doesn't exist", async () => {
      const res = await chai.request(app)
        .get(`${baseUrl}/100000`)
        .send();

      expect(res.status).to.equal(404);
      expect(res.body).to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.equal('Product not found');
    });

    it('should encounter an error retrieving products', async () => {
      const dbStub = sinon.stub(Products, 'getProduct').throws(new Error());
      const res = await chai.request(app)
        .get(`${baseUrl}/${product.id}`)
        .send();
      
      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal('Internal server error');
      expect(dbStub.called).to.be.true;
      dbStub.restore();
    });
  });
});
