import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import app from '../..';
import Products from '../../db/products';
import { internalServerError } from '../../utils/constants';


const { expect } = chai;
chai.use(chaiHttp);
const url = '/api/v1/products';


describe(`GET ${url}`, () => {
  describe('SUCCESS', () => {
    it('should get the first page (10 items) of products', async () => {
      const res = await chai.request(app)
        .get(url)
        .send();
      
      const getRes = await Products.getProducts(1);
      const { rows: dbProducts } = getRes;
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array');
      expect(res.body.data).to.have.length(dbProducts.length);
    });

    it('should get the first page (10 items) of products', async () => {
      const res = await chai.request(app)
        .get(`${url}?page=1`)
        .send();
      
      const getRes = await Products.getProducts(1);
      const { rows: dbProducts } = getRes;
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array');
      expect(res.body.data).to.have.length(dbProducts.length);
    });

    it('should get an empty list for a page of products beyond the available', async () => {
      const res = await chai.request(app)
        .get(`${url}?page=50`)
        .send();
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('array');
      expect(res.body.data).to.have.length(0);
    });
  });

  describe('FAILURE', () => {
    const queryParameterError = 'Query parameter value for "page" must be a number greater than zero';

    it('should encounter an error retrieving products', async () => {
      const dbStub = sinon.stub(Products, 'getProducts').throws(new Error());
      const res = await chai.request(app)
        .get(url)
        .send();
      
      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(internalServerError);
      expect(dbStub.called).to.be.true;
      dbStub.restore();
    });

    it('should fail to retrieve products for a non-number page query parameter value', async () => {
      const res = await chai.request(app)
        .get(`${url}?page=abc`)
        .send();
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(queryParameterError);
    });

    it('should fail to retrieve products for a less than 1 page query parameter value', async () => {
      const res = await chai.request(app)
        .get(`${url}?page=0`)
        .send();
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(queryParameterError);
    });
  });
});
