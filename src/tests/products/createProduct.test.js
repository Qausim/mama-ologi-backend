import chai from 'chai';
import chaiHttp from 'chai-http';
import { v2 as cloudinary } from 'cloudinary';
import sinon from 'sinon';

import app from '../..';
import jwtUtils from '../../utils/jwtUtils';
import envVariables from '../../environment';
import Products from '../../db/products';
import { mockProduct1 } from '../../mock/product.mock';
import { internalServerError, productCreationError } from '../../utils/constants';
import Users from '../../db/users';
import { mockUser } from '../../mock/user.mock';

chai.use(chaiHttp);
const { expect } = chai;
const url = '/api/v1/products';
const { adminEmail } = envVariables;
let admin;
let adminToken;
let user;
const data = mockProduct1;

const splittedDir = __dirname.replace(/[\\]/g, '/').split('/');
const testImagesDir = `${splittedDir.slice(0, splittedDir.length - 3).join('/')}/testImages`;
const fakeCloudinaryBaseUrl = 'https://res.cloudinary.com/qausim/image/upload/v1';


describe(`POST ${url}`, () => {
  let uploaderStub;

  before((done) => {
    Users.getUser(adminEmail)
      .then(({ rows }) => {
        admin = rows[0];
        adminToken = jwtUtils.generateToken(admin);
        return Users.getUser(mockUser.email);
      })
      .then(({ rows }) => {
        user = rows[0];
        user.token = jwtUtils.generateToken(user);
      })
      .then(() => {
        uploaderStub = sinon.stub(cloudinary.uploader, 'upload').callsFake((path, options) => {
          return new Promise((resolve) => {
            resolve({ secure_url: `${fakeCloudinaryBaseUrl}/${options.folder}/${options.public_id}` });
          });
        });
        done();
      }).catch((error) => done(error));
  });

  after((done) => {
    uploaderStub.restore();
    done();
  });

  describe('SUCCESS', () => {
    const image = `${testImagesDir}/py.png`;

    it('should create a product with an image', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description)
        .attach('productImages', image);

      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'price_denomination', 'weight_unit');
      expect(res.body.data.owner_id).to.eql(admin.id.toString());
      expect(res.body.data.description).to.be.a('string');
      expect(res.body.data.price).to.equal(data.price.toString());
      expect(res.body.data.price_denomination).to.equal(data.priceDenomination);
      expect(res.body.data.weight).to.equal(data.weight.toString());
      expect(res.body.data.weight_unit).to.equal(data.weightUnit);
      expect(res.body.data.images).to.be.an('array').and.to.have.length(1);
      expect(res.body.data.images[0]).to.be.a('string').and.satisfy((url) => url.startsWith(fakeCloudinaryBaseUrl));
      expect(uploaderStub.called).to.be.true;
    });

    it('should create a product without an image', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(201);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'data');
      expect(res.body.status).to.equal('success');
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.keys('id', 'owner_id', 'title', 'price', 'weight',
        'description', 'images', 'weight_unit', 'price_denomination');
      expect(res.body.data.owner_id).to.equal(admin.id.toString());
      expect(res.body.data.description).to.be.a('string');
      expect(res.body.data.price).to.equal(data.price.toString());
      expect(res.body.data.price_denomination).to.equal(data.priceDenomination);
      expect(res.body.data.weight).to.equal(data.weight.toString());
      expect(res.body.data.weight_unit).to.equal(data.weightUnit);
      expect(res.body.data.images).to.be.an('array').and.to.be.empty;
    });
  });

  describe('FAILURE', () => {
    it('should fail to create a product by a non-admin', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', `Bearer ${user.token}`)
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);
      
      expect(res.status).to.equal(403);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal(productCreationError);
    });

    it('should fail to create a product when no token supplied', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal('You need to be signed in to perform this operation');
    });

    it('should fail to create a product when invalid token supplied', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', `Bearer ${new Array(5).fill('srw2340kd').join('')}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(401);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.have.key('message');
      expect(res.body.error.message).to.be.equal('Unauthorized operation, please sign in and try again');
    });

    it('should fail to create a product without a title field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === 'Please enter a valid title for the product (at least 6 characters)';
      });
    });

    it('should fail to create a product with an empty title string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', '')
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === 'Please enter a valid title for the product (at least 6 characters)';
      });
    });

    it('should fail to create a product with a title string containing only spaces', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', '                 ')
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === 'Please enter a valid title for the product (at least 6 characters)';
      });
    });

    it('should fail to create a product with a title less than 6 characters', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title.slice(0, 5))
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ title }) => title);
        return error.title === 'Please enter a valid title for the product (at least 6 characters)';
      });
    });

    it('should fail to create a product with a title less than 6 alphanumeric characters padded with spaces',
      async () => {
        const res = await chai.request(app)
          .post(url)
          .set('Authorization', adminToken)
          .set('Content-Type', 'multipart/form-data')
          .field('title', `${data.title.slice(0, 5)}         `)
          .field('price', data.price)
          .field('priceDenomination', data.priceDenomination)
          .field('weight', data.weight)
          .field('weightUnit', data.weightUnit)
          .field('description', data.description);

        expect(res.status).to.equal(400);
        expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
        expect(res.body.status).to.equal('error');
        expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
          const error = errors.find(({ title }) => title);
          return error.title === 'Please enter a valid title for the product (at least 6 characters)';
        });
      });

    it('should fail to create a product without a price field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === 'Please enter a valid price (numeric) for the product';
      });
    });

    it('should fail to create a product with a empty price string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', '')
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === 'Please enter a valid price (numeric) for the product';
      });
    });

    it('should fail to create a product with a non-numeric price string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', 'ab5')
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ price }) => price);
        return error.price === 'Please enter a valid price (numeric) for the product';
      });
    });

    it('should fail to create a product without a priceDenomination field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ priceDenomination }) => priceDenomination);
        return error.priceDenomination === 'Please choose a denomination for the price';
      });
    });

    it('should fail to create a product with an empty priceDenomination string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', '')
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ priceDenomination }) => priceDenomination);
        return error.priceDenomination === 'Please choose a denomination for the price';
      });
    });

    it('should fail to create a product with a priceDenomination string containing only spaces', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', '        ')
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ priceDenomination }) => priceDenomination);
        return error.priceDenomination === 'Please choose a denomination for the price';
      });
    });

    it('should fail to create a product with a priceDenomination string besides "NGN" and "USD"', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', 'GHC')
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);
  
      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ priceDenomination }) => priceDenomination);
        return error.priceDenomination === 'Please choose a denomination for the price';
      });
    });

    it('should fail to create a product without a weight field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weight }) => weight);
        return error.weight === 'Please enter a valid weight (numeric) value for the product';
      });
    });

    it('should fail to create a product with a non-numeric weight string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', 'ab5')
        .field('weightUnit', data.weightUnit)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weight }) => weight);
        return error.weight === 'Please enter a valid weight (numeric) value for the product';
      });
    });

    it('should fail to create a product without a weightUnit field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weightUnit }) => weightUnit);
        return error.weightUnit === 'Please choose unit for the weight, "g" or "kg"';
      });
    });

    it('should fail to create a product with an empty weightUnit string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', '')
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weightUnit }) => weightUnit);
        return error.weightUnit === 'Please choose unit for the weight, "g" or "kg"';
      });
    });

    it('should fail to create a product with a weightUnit string containing only spaces', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', '      ')
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weightUnit }) => weightUnit);
        return error.weightUnit === 'Please choose unit for the weight, "g" or "kg"';
      });
    });

    it('should fail to create a product with a weightUnit string besides "g" and "kg"', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', 'lb')
        .field('description', data.description);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ weightUnit }) => weightUnit);
        return error.weightUnit === 'Please choose unit for the weight, "g" or "kg"';
      });
    });

    it('should fail to create a product without a description field', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === "Please provide the product's description";
      });
    });

    it('should fail to create a product with an empty description string', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', '');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === "Please provide the product's description";
      });
    });

    it('should fail to create a product with an description string containing only spaces', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', '    ');

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('array').and.to.satisfy((errors) => {
        const error = errors.find(({ description }) => description);
        return error.description === "Please provide the product's description";
      });
    });

    it('should fail to upload more than 4 image files', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/py.png`)
        .attach('productImages', `${testImagesDir}/py2.png`)
        .attach('productImages', `${testImagesDir}/py3.png`)
        .attach('productImages', `${testImagesDir}/camera.jpg`)
        .attach('productImages', `${testImagesDir}/camera2.jpg`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal('Maximum of 4 image files allowed');
    });

    it('should fail to upload a non-jpeg or non-png image', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/py.png`)
        .attach('productImages', `${testImagesDir}/drone3.webp`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal('Only jpeg and png images, each not greater than 2mb, are allowed');
    });

    it('should fail to upload an image greater than 2mb in size', async () => {
      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/jill-heyer.jpg`);

      expect(res.status).to.equal(400);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal('Only jpeg and png images, each not greater than 2mb, are allowed');
    });

    it('should encounter an error saving new product in database', async () => {
      const dbStub = sinon.stub(Products, 'addProduct').throws(new Error());

      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/py.png`);
        
      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal(internalServerError);
      expect(dbStub.called).to.be.true;
      dbStub.restore();
    });

    it('should encounter an error while uploading images', async () => {
      // Restore previous behaviour of Cloudinary upload API before setting a new stub
      uploaderStub.restore();
      uploaderStub = sinon.stub(cloudinary.uploader, 'upload').throws(new Error());

      const res = await chai.request(app)
        .post(url)
        .set('Authorization', adminToken)
        .set('Content-Type', 'multipart/form-data')
        .field('title', data.title)
        .field('price', data.price)
        .field('priceDenomination', data.priceDenomination)
        .field('weight', data.weight)
        .field('weightUnit', data.weightUnit)
        .field('description', data.description)
        .attach('productImages', `${testImagesDir}/py.png`);

      expect(res.status).to.equal(500);
      expect(res.body).to.be.an('object').and.to.have.keys('status', 'error');
      expect(res.body.status).to.equal('error');
      expect(res.body.error).to.be.an('object').and.to.have.property('message');
      expect(res.body.error.message).to.equal('Error uploading images');
    });
  });
})
