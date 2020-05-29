import chai from 'chai';
import Sinon from 'sinon';
import chaiHttp from 'chai-http';

import app from '../../';
import User from '../../models/user';
import dbConnection from '../../db/dbConnection';
import { mockUser2 } from '../../mock/user.mock';
import {
  internalServerError, userTableName, accountConflictError, invalidEmailError,
  passwordValidationError, firstNameValidationError, lastNameValidationError,
  phoneValidationError, addressValidationError, streetValidationError, stateValidationError,
  countryValidationError,
} from '../../utils/constants';


chai.use(chaiHttp);
const { expect } = chai;
const signupUrl = '/api/v1/auth/signup';
let userId;
const testUser = mockUser2;

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
        'id', 'email', 'first_name', 'last_name', 'phone', 'address',
        'street', 'state', 'country', 'role', 'token', 'wishlist', 'cart'
      );
      expect(res.body.data.wishlist).to.be.an('array').and.to.have.length(0);

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
      expect(res.body.error.message).to.equal(accountConflictError);
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
      expect(res.body.error[0].email).to.equal(invalidEmailError);
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
      expect(res.body.error[0].password).to.equal(passwordValidationError);
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
      expect(res.body.error[0].firstName).to.equal(firstNameValidationError);
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
      expect(res.body.error[0].lastName).to.equal(lastNameValidationError);
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
      expect(res.body.error[0].phone).to.equal(phoneValidationError);
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
      expect(res.body.error[0].address).to.equal(addressValidationError);
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
      expect(res.body.error[0].street).to.equal(streetValidationError);
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
      expect(res.body.error[0].state).to.equal(stateValidationError);
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
      expect(res.body.error[0].country).to.equal(countryValidationError);
    });
    
    it('should fail to register a user due to internal server error in the controller', async () => {
      const dbStub = Sinon.stub(User.prototype, 'save').throws(new Error());
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
      const dbStub = Sinon.stub(User, 'findByEmail').throws(new Error());
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
