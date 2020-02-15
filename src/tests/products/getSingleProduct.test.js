import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import app from '../..';
import Products from '../../db/products';
import dbConnection from '../../db/dbConnection';
import { selectAdminId, insertProductQuery } from '../../db/migration';


const { expect } = chai;
chai.use(chaiHttp);
const baseUrl = '/api/v1/products';
let product;

before((done) => {
  dbConnection.dbConnect(selectAdminId)
    .then(({ rows: [{ id }] }) => dbConnection.dbConnect(insertProductQuery, [id]))
    .then(({ rows }) => {
      if (rows.length) {
        product = rows[0];
        return done();
      }
      throw new Error('No product found');
    })
    .catch((e) => done(e));
});


describe(`GET ${baseUrl}/:productId`, () => {
  describe('SUCCESS', () => {
    it('should get a single product', async () => {
      const res = await chai.request(app)
        .get(`${baseUrl}/${product.id}`)
        .send();
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'price_denomination',
      'weight', 'weight_unit', 'description', 'images');
      expect(res.body.data.description).to.be.a('string');
      expect(res.body.data.price).to.be.a('string').and.to.equal(product.price);
      expect(res.body.data.price_denomination).to.equal(product.price_denomination);
      expect(res.body.data.weight).to.equal(product.weight);
      expect(res.body.data.weight_unit).to.equal(product.weight_unit);
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