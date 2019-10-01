import { Router } from 'express';

const v1Router = Router();

v1Router.get('/', (request, response) => {
  response.status(200).send('Welcome to /api/v1');
});

export default v1Router;
