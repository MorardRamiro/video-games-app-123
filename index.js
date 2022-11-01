const express = require('express');
const bodyParser = require('body-parser');
const { init } = require('./db');
const routes = require('./routes');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(routes);

init().then(() => {
  console.log('starting server on port 3001');
  app.listen(3001);
});
