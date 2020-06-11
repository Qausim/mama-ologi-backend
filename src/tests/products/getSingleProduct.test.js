import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import app from '../..';
import dbConnection from '../../db/dbConnection';
import { internalServerError, productTableName, productNotFoundError } from '../../utils/constants';
import Product from '../../models/product';


const { expect } = chai;
chai.use(chaiHttp);
const baseUrl = '/api/v1/products';
let product;

before((done) => {
  dbConnection.dbConnect(`SELECT * FROM ${productTableName} LIMIT 1`)
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
      expect(res.body.data).to.have.keys(
        'id', 'owner_id', 'title', 'price', 'weight', 'description',
        'images', 'first_name', 'last_name', 'phone', 'stock', 'discount'
      );
      expect(res.body.data.description).to.be.a('string');
      expect(res.body.data.price).to.be.a('string').and.to.equal(product.price);
      expect(res.body.data.weight).to.equal(product.weight);
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
      expect(res.body.error.message).to.equal(productNotFoundError);
    });

    it('should encounter an error retrieving a single product', async () => {
      const dbStub = sinon.stub(Product, 'findById').throws(new Error());
      const res = await chai.request(app)
        .get(`${baseUrl}/${product.id}`)
        .send();
      
      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(internalServerError);
      expect(dbStub.called).to.be.true;
      dbStub.restore();
    });
  });
});
