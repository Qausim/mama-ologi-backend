import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../../';
import dbConnection from '../../db/dbConnection';
import { userTableName } from '../../db/migration';
import { mockUser } from '../../mock/auth.mock';
import Sinon from 'sinon';
import Users from '../../db/users';
import { internalServerError } from '../../utils/constants';


chai.use(chaiHttp);
const { expect } = chai;
const signupUrl = '/api/v1/auth/signup';
let userId;
const testUser = mockUser;

after((done) => {
  dbConnection.dbConnect(`DELETE FROM ${userTableName} WHERE id=$1`, [userId])
    .then(() => done())
    .catch((error) => done(error));
});


describe(`POST ${signupUrl}`, () => {
  describe('SUCCESS', () => {
    it('should register a user successfully', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send(testUser);
      
      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object').and.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object').and.to.have.keys(
        'id', 'email', 'first_name', 'last_name', 'phone',
        'address', 'street', 'state', 'country', 'role_id', 'token'
      );

      userId = res.body.data.id;
      [
        'email', 'first_name', 'last_name', 'phone', 'address', 'street', 'state', 'country'
      ].forEach((key) => {
        expect(res.body.data[key]).to.satisfy(value => {
          const [first, ...rest] = key.split('_');
          const requestKey = first + rest.map(el => el[0].toUpperCase() + el.slice(1));
          return value === testUser[requestKey];
        });
      });
    });
  });

  describe('FAILURE', () => {
    it('should fail to register a user with an existing email', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send(testUser);
      
      expect(res.status).to.equal(409);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal('Account already exists');
    });

    it('should fail to register a user without an email', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: undefined });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('email');
      expect(res.body.error[0].email).to.equal('Invalid email address');
    });

    it('should fail to register a user with an invalid password', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', password: 'bola' });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('password');
      expect(res.body.error[0].password).to.equal('Password must be at least 8 characters long');
    });
    
    it('should fail to register a user with an invalid first name', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', firstName: 'Bolajide-' });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('firstName');
      expect(res.body.error[0].firstName).to.equal('First name is required, as a sequence of letters hyphenated or not');
    });
    
    it('should fail to register a user with an invalid last name', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', lastName: 'Bolajide-' });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('lastName');
      expect(res.body.error[0].lastName).to.equal('Last name is required, as a sequence of letters hyphenated or not');
    });
    
    it('should fail to register a user with an invalid phone', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', phone: 1234567 });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('phone');
      expect(res.body.error[0].phone).to.equal('Invalid phone number');
    });

    it('should fail to register a user with a too long address', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', address: undefined });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('address');
      expect(res.body.error[0].address).to.equal('Address is required. Maximum length 150');
    });
    
    it('should fail to register a user with a too long street', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', street: undefined });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('street');
      expect(res.body.error[0].street).to.equal('Street is required. Maximum length 80');
    });

    it('should fail to register a user with a too long state', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', state: undefined });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('state');
      expect(res.body.error[0].state).to.equal('State is required. Maximum length 50');
    });

    it('should fail to register a user with no country', async () => {
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com', country: undefined });
      
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array')
      expect(res.body.error[0]).to.be.an('object').and.to.have.key('country');
      expect(res.body.error[0].country).to.equal('Country is required. Maximum length 50');
    });
    
    it('should fail to register a user due to internal server error in the controller', async () => {
      const dbStub = Sinon.stub(Users, 'insertUser').throws(new Error());
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com' });
      
      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal('Unable to create account');
      dbStub.restore();
    });
    
    it('should fail to register a user due to internal server error validating user exists', async () => {
      const dbStub = Sinon.stub(Users, 'getUser').throws(new Error());
      const res = await chai.request(app)
        .post(signupUrl)
        .send({ ...testUser, email: 'qauzeem2@example.com' });
      
      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.key('message');
      expect(res.body.error.message).to.equal(internalServerError);
      dbStub.restore();
    });
  });
});
