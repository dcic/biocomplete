import _debug from 'debug';
import route from 'koa-route';

import { Assay, CellLine } from './models';
const debug = _debug('server:routes');

const BASE = '/biocomplete/api/v1';

function runSearch(Model, searchQ) {
  return new Promise((resolve, reject) => {
    const elasticQ = {
      query_string: {
        query: searchQ,
      },
    };
    Model.search(elasticQ, { hydrate: true }, (err, results) => {
      if (err) {
        reject(err);
      }
      resolve(results.hits.hits);
    });
  });
}

const searchEntities = async (ctx, entity) => {
  if (ctx.method !== 'GET') {
    return;
  }

  let Model;

  switch (entity) {
    case 'assay':
      Model = Assay;
      break;
    case 'cellLine':
      Model = CellLine;
      break;
    // case 'disease':
    //   Model = Models.Disease;
    //   break;
    default:
      ctx.throw(
        400,
        'Invalid entity. Currently only assay, cellLine, and disease are supported.'
      );
  }
  const query = ctx.request.query.q;
  if (!query) {
    ctx.throw(400, 'No search term provided. Use the "q" query parameter to search.');
  }
  ctx.body = await runSearch(Model, query);
};

const getCounts = async (ctx) => {
  const cellLines = await CellLine.count().exec();
  ctx.body = { cellLines };
};

const healthCheck = async (ctx) => {
  // Check db connection
  const cellLineCount = await CellLine.count().exec();
  if (cellLineCount > 0) {
    ctx.body = `Everything is working just fine.`;
  } else {
    ctx.throw(500, 'Something bad is happening.');
  }
};

export default function routes(app) {
  debug('Requiring routes...');
  // Unprotected Routes

  app.use(route.get(`${BASE}/:entity/search`, searchEntities));
  app.use(route.get(`${BASE}/counts`, getCounts));
  app.use(route.get(`${BASE}/health`, healthCheck));
}
