import chai from 'chai';
import chaiHttp from 'chai-http';

import app from '../index';

chai.use(chaiHttp);
const { expect } = chai;

describe('Sample test', () => {
  it('should return a 200', async () => {
    const res = await chai.request(app)
      .get('/')
      .send();

    expect(res.status).to.equal(200);
  });

  it('should return 404', async () => {
    const res = await chai.request(app)
      .get('/someweirdroute')
      .send();

    expect(res.status).to.equal(404);
  });
});
