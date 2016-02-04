import Koa from 'koa';
import mongoose from 'mongoose';
import convert from 'koa-convert';
import cors from 'koa-cors';
import logger from 'koa-logger';
import compress from 'koa-compress';
import bodyParser from 'koa-bodyparser';
import _debug from 'debug';

import makeRoutes from './routes';
import runQueries from './query';

const debug = _debug('server');

mongoose.connect('mongodb://146.203.54.131:27017/biocomplete', (err) => {
  if (err) {
    debug(`An error occurred connecting to db: ${err}`);
  } else {
    debug('Successfully connected to database.');
  }
});

mongoose.promise = Promise;

const app = new Koa();
const PORT = 4000;

app.use(convert(cors()));
app.use(convert(bodyParser()));
app.use(convert(logger()));
app.use(convert(compress()));

makeRoutes(app);

if (process.env.NODE_ENV !== 'production') {
  mongoose.set('debug', true);
  runQueries();
}

app.listen(PORT);
debug(`Server is now running on port ${PORT}.`);
