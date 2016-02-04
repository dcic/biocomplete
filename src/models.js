import mongoose, { Schema } from 'mongoose';
import mongoosastic from 'mongoosastic';
import elasticSearch from 'elasticsearch';
import _debug from 'debug';

// import _ from 'lodash';
// import cellAttributes from '../data/cellTissueAttributes';

const debug = _debug('server:models');
debug('Requiring models and connecting to elastic search instances...');

// const entitySchema = new Schema({
//   name: { type: String, es_boost: 2.0, es_indexed: true, es_type: 'string' },
//   ontologyId: { type: String, es_indexed: true, es_type: 'string' },
// });

const cellSchema = new Schema({
  name: {
    type: String,
    es_indexed: true,
    es_boost: 2.0,
    es_type: 'string',
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
  description: String,
});

const client = new elasticSearch.Client({
  hosts: [
    '146.203.54.74:31000',
    '146.203.54.165:31000',
    '146.203.54.92:31000',
  ],
  requestTimeout: 1000000,
  sniffOnConnectionFault: true,
  log: process.env.NODE_ENV === 'production' ? undefined : 'trace',
});

// entitySchema.plugin(mongoosastic, {
//   esClient: client,
// });

cellSchema.plugin(mongoosastic, {
  esClient: client,
});

export const CellLine = mongoose.model('CellLine', cellSchema);

// CellLine.createMapping((err, mapping) => {
//   debug('Mapping...');
//   if (err) {
//     debug(`Mapping Error: ${err}`);
//   } else {
//     debug(`Mapping created!: ${mapping}`);
//   }
// });

// let numLeft = Object.keys(cellAttributes).length;
//
// _.each(cellAttributes, (cellObj) => {
//   let name = cellObj.name;
//   const splitName = cellObj.name.split(' ');
//   if (splitName.length && splitName[splitName.length - 1] === 'cell') {
//     name = splitName.slice(0, -1).join(' ');
//   }
//   CellLine.create({
//     name,
//     type: cellObj.type,
//     url: cellObj.url,
//     description: cellObj.description,
//     ontologyId: cellObj.id,
//   }, (err) => {
//     if (err) {
//       debug(`Error occurred inserting cell line: ${err}`);
//     } else {
//       debug(`Entered cell line with name: ${name}`);
//       numLeft--;
//       debug(`There are ${numLeft} cell lines left to insert.`);
//     }
//   });
// });
