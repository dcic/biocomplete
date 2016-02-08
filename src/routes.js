import _debug from 'debug';
import route from 'koa-route';

import { esClient, Assay, CellLine } from './models';
const debug = _debug('server:routes');

const BASE = '/biocomplete/api/v1';

function runSearch(Model, searchQ, index, type) {
  return new Promise((resolve, reject) => {
    const body = {
      query: {
        match_phrase_prefix: {
          _all: searchQ,
        },
      },
    };
    esClient
      .search({ index, type, body })
      .then((resp) => {
        const resultIds = resp.hits.hits.map((resultObj) => resultObj._id);
        Model
          .find({ _id: { $in: resultIds } })
          .lean()
          .exec((dbErr, dbResults) => {
            if (dbErr) {
              reject(dbErr);
            } else {
              resolve(dbResults);
            }
          });
      }, (err) => {
        reject(err);
      });
  });
}

const searchEntities = async (ctx, entity) => {
  if (ctx.method !== 'GET') {
    return;
  }

  let Model;
  let index;
  let type;

  switch (entity) {
    case 'assay':
      Model = Assay;
      index = 'assays';
      type = 'assay';
      break;
    case 'cellLine':
      Model = CellLine;
      index = 'celllines';
      type = 'cellline';
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
  ctx.body = await runSearch(Model, query, index, type);
};

const getCounts = async (ctx) => {
  const assays = await Assay.count().exec();
  const cellLines = await CellLine.count().exec();
  ctx.body = { assays, cellLines };
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
