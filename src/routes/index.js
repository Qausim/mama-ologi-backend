import { Router } from 'express';
import swaggerUI from 'swagger-ui-express';

import v1Router from './v1Routes';
import swaggerDoc from '../../swagger.json';
import { internalServerError } from '../utils/constants';

const appRouter = Router();


appRouter.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

appRouter.get('/', (request, response) => {
  response.status(200).send('Welcome the Mama Ologi');
});

appRouter.use('/api/v1', v1Router);

appRouter.use((request, response, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

// eslint-disable-next-line no-unused-vars
appRouter.use((error, request, response, next) => {
  response.status(error.status || 500).json({
    status: 'error',
    error: {
      message: error.message || internalServerError,
    },
  });
});

export default appRouter;
