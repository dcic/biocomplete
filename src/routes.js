/* eslint no-param-reassign:0 */
import _debug from 'debug';
import route from 'koa-route';

import { Assay, CellLine, Disease, Drug, Gene, Organism } from './models';
const debug = _debug('server:routes');

const BASE = '/biocomplete/api/v1';

const suggestEntities = async (ctx, entity) => {
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
    case 'disease':
      Model = Disease;
      break;
    case 'drug':
      Model = Drug;
      break;
    case 'gene':
      Model = Gene;
      break;
    case 'organism':
      Model = Organism;
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

  const limit = ctx.request.query.limit || 10;

  ctx.body = await Model
    .find({ name: new RegExp(query, 'i') }, '-_id -suggest -__v')
    .limit(limit)
    .lean()
    .exec();
  // ctx.body = await runSuggest(Model, query, index, type, size);
};

const getCounts = async (ctx) => {
  ctx.body = {
    assays: await Assay.count().exec(),
    cellLines: await CellLine.count().exec(),
    diseases: await Disease.count().exec(),
    drugs: await Drug.count().exec(),
    genes: await Gene.count().exec(),
    organisms: await Organism.count().exec(),
  };
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
