import mongoose, { Schema } from 'mongoose';
import mongoosastic from 'mongoosastic';
import elasticSearch from 'elasticsearch';
import _debug from 'debug';

const debug = _debug('server:models');
debug('Requiring models and connecting to elastic search instances...');

const assaySchema = new Schema({
  name: {
    type: String,
    index: {
      required: true,
      unique: true,
    },
    es_indexed: true,
    es_type: 'string',
  },
  suggest: {
    input: String,
    output: String,
    payload: {
      _id: Schema.Types.ObjectId,
    },
  },
  ontologyId: { type: String, es_indexed: true, es_type: 'string' },
});

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
  suggest: {
    input: String,
    output: String,
    payload: {
      _id: Schema.Types.ObjectId,
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
  requestTimeout: 10000,
  sniffOnConnectionFault: true,
  // log: process.env.NODE_ENV !== 'production' ? 'trace' : undefined,
});

const mongoosasticConf = {
  esClient,
  bulk: {
    size: 1500, // preferred number of docs to bulk index
    delay: 1500, // milliseconds to wait for enough docs to meet size constraint
    batch: 50,
  },
};

assaySchema.plugin(mongoosastic, mongoosasticConf);

entitySchema.plugin(mongoosastic, mongoosasticConf);

export const Assay = mongoose.model('Assay', assaySchema);
export const CellLine = mongoose.model('CellLine', entitySchema);
export const Disease = mongoose.model('Disease', entitySchema);
export const Drug = mongoose.model('Drug', entitySchema);
export const Gene = mongoose.model('Gene', entitySchema);
export const Organism = mongoose.model('Organism', entitySchema);
