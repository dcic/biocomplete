/* eslint no-param-reassign:0 */
import _debug from 'debug';
import route from 'koa-route';

import { esClient, Assay, CellLine, Disease, Drug, Gene, Organism } from './models';
const debug = _debug('server:routes');

const BASE = '/biocomplete/api/v1';

function runSuggest(Model, suggestQ, index, type, size = 10) {
  return new Promise((resolve, reject) => {
    const suggestKey = `${type}-suggest`;
    const body = {
      [suggestKey]: {
        text: suggestQ,
        completion: {
          field: 'suggest',
          size,
        },
      },
    };
    esClient
      .suggest({ index, body })
      .then((resp) => {
        const results = resp[suggestKey][0].options;
        const resultIds = results.map((result) => result.payload._id);
        Model
          .find({ _id: { $in: resultIds } })
          .select('-__v -suggest')
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

const suggestEntities = async (ctx, entity) => {
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
    case 'disease':
      Model = Disease;
      index = 'diseases';
      type = 'disease';
      break;
    case 'drug':
      Model = Drug;
      index = 'drugs';
      type = 'drug';
      break;
    case 'gene':
      Model = Gene;
      index = 'genes';
      type = 'gene';
      break;
    case 'organism':
      Model = Organism;
      index = 'organisms';
      type = 'organism';
      break;
    default:
      ctx.throw(
        400,
        'Invalid entity. Currently only assay, cellLine, ' +
        'disease, drug, gene, and organism are supported.'
      );
  }
  const query = ctx.request.query.q;
  if (!query) {
    ctx.throw(400, 'No query term provided. Use the "q" query parameter to search.');
  }
  const size = ctx.request.query.size;
  ctx.body = await runSuggest(Model, query, index, type, size);
};

const getCounts = async (ctx) => {
  const assays = await Assay.count().exec();
  const cellLines = await CellLine.count().exec();
  ctx.body = { assays, cellLines };
};

const healthCheck = async (ctx) => {
  try {
    await CellLine.count().exec();
  } catch (e) {
    debug(e);
    ctx.throw(500, 'Something bad is happening.');
  }
  ctx.body = 'Everything is working just fine.';
};

export default function routes(app) {
  debug('Requiring routes...');
  // Unprotected Routes

  app.use(route.get(`${BASE}/:entity/suggest`, suggestEntities));
  app.use(route.get(`${BASE}/counts`, getCounts));
  app.use(route.get(`${BASE}/health`, healthCheck));
}
