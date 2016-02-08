import mongoose, { Schema } from 'mongoose';
import mongoosastic from 'mongoosastic';
import elasticSearch from 'elasticsearch';
import _debug from 'debug';

const debug = _debug('server:models');
debug('Requiring models and connecting to elastic search instances...');

const entitySchema = new Schema({
  name: {
    type: String,
    index: {
      required: true,
      unique: true,
    },
    es_indexed: true,
    es_type: 'string',
  },
  ontologyId: { type: String, es_indexed: true, es_type: 'string' },
});

const cellSchema = new Schema({
  name: {
    type: String,
    es_indexed: true,
    es_type: 'string',
    es_analyzer: 'synonym',
    index: {
      required: true,
      unique: true,
    },
  },
  ontologyId: {
    type: String,
    es_indexed: true,
    es_type: 'string',
  },
  type: String,
  url: String,
  description: {
    type: String,
    es_indexed: true,
    es_type: 'string',
  },
});

export const esClient = new elasticSearch.Client({
  host: '146.203.54.239:31000',
  sniffOnStart: true,
  requestTimeout: 1000000,
  sniffOnConnectionFault: true,
  log: process.env.NODE_ENV === 'production' ? undefined : 'trace',
});

entitySchema.plugin(mongoosastic, { esClient });

cellSchema.plugin(mongoosastic, { esClient });

export const Assay = mongoose.model('Assay', entitySchema);
export const CellLine = mongoose.model('CellLine', cellSchema);
