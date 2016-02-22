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
  suggest: {
    input: String,
    output: String,
    payload: {
      _id: Schema.Types.ObjectId,
    },
  },
  ontologyId: { type: String, es_indexed: true, es_type: 'string' },
});

const cellSchema = new Schema({
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
  log: process.env.NODE_ENV === 'production' ? undefined : 'trace',
});

const mongoosasticConf = {
  esClient,
  bulk: {
    size: 1000, // preferred number of docs to bulk index
    delay: 1000, // milliseconds to wait for enough docs to meet size constraint
  },
};

entitySchema.plugin(mongoosastic, mongoosasticConf);

cellSchema.plugin(mongoosastic, mongoosasticConf);

export const Assay = mongoose.model('Assay', entitySchema);
export const Drug = mongoose.model('Drug', entitySchema);
export const CellLine = mongoose.model('CellLine', cellSchema);
