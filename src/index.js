import http from 'http';

import express from 'express';
import bodyParser from 'body-parser';

import router from './routes';


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use((request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*'); // giving access to all
  response.header('Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (request.method === 'OPTIONS') {
    response.header('Access-Control-Allow-Methods',
      'PUT, POST, PATCH, DELETE, GET');
    return response.status(200).json({});
  }
  next();
});

app.use('/', router);


const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => console.log(`Server listening on PORT: ${PORT}`));

export default app;
