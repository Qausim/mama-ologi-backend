import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';

import app from '../../index';
import envVariables from '../../environment';
import Users from '../../db/users';
import { internalServerError } from '../../utils/constants';


chai.use(chaiHttp);
const { expect } = chai;

const { adminEmail, adminPassword } = envVariables;
const baseUrl = '/api/v1/auth';
const signinUrl = `${baseUrl}/signin`;
const signinError = 'Invalid email or password';

describe(signinUrl, () => {
  describe('SUCCESS', () => {
    it('should sign in a user successfully', async () => {
      const res = await chai.request(app)
        .post(signinUrl)
        .send({
          email: adminEmail,
          password: adminPassword
        });

      expect(res.status).to.equal(200);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.property('email');
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.email).to.equal(adminEmail);
    });
  });

  describe('FAILURE', () => {
    it('should fail to log in a user with invalid email', async () => {
      const res = await chai.request(app)
        .post(signinUrl)
        .send({
          email: 'admin@gmail',
          password: adminPassword
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.equal(signinError);
    });

    it('should fail to log in a user with invalid password', async () => {
      const res = await chai.request(app)
        .post(signinUrl)
        .send({
          email: adminEmail,
          password: 'admin'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.equal(signinError);
    });

    it('should fail to log in a user with incorrect email', async () => {
      const res = await chai.request(app)
        .post(signinUrl)
        .send({
          email: 'admin@gmail.com',
          password: adminPassword
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.equal(signinError);      
    });

    it('should fail to log in a user with incorrect password', async () => {
      const res = await chai.request(app)
        .post(signinUrl)
        .send({
          email: adminEmail,
          password: 'ayindeolohunorin'
        });

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.equal(signinError);
    });

    it('should fail due to internal server error', async () => {
      const stub = sinon.stub(Users, 'getUser').throws(new Error());
      const res = await chai.request(app)
        .post(signinUrl)
        .send({
          email: adminEmail,
          password: adminPassword
        });

      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object');
      expect(res.body).to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.equal(internalServerError);
      expect(stub.called).to.be.true;
      stub.restore();
    });
  });
});
