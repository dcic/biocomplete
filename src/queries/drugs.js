/* eslint no-param-reassign:0 */
import _debug from 'debug';
import each from 'lodash/each';
import mongoose from 'mongoose';

import { esClient, Drug } from '../models';

import drugAttributes from '../../data/chemicalMergeAttributes';
// import drugSynonyms from '../../data/chemicalMergeSynonyms';

const debug = _debug('server:queries:drugs');
const drugs = [];

export function insertAllDrugs() {
  Drug.remove({}, () => {
    let drugsLeft = Object.keys(drugAttributes).length;
    each(drugAttributes, ({ name, type, url, description, id }) => {
      if (/[a-zA-Z]/.test(name)) {
        const _id = new mongoose.Types.ObjectId;
        drugs.push({
          _id,
          name,
          suggest: {
            input: name,
            output: name,
            payload: { _id },
          },
          type,
          url,
          description,
          ontologyId: id,
        });
      }
      drugsLeft--;
      debug(`There are ${drugsLeft} drugs left.`);
    });
    Drug.insertMany(drugs, (err) => {
      if (err) {
        debug(err);
      }
    });
  });
}

const drugMapping = {
  index: 'drugs',
  type: 'drug',
  body: {
    drug: {
      properties: {
        name: {
          type: 'string',
        },
        ontologyId: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        suggest: {
          type: 'completion',
          analyzer: 'simple',
          search_analyzer: 'simple',
          payloads: true,
        },
      },
    },
  },
};

export default () => {
  esClient.indices.delete({ index: 'drugs' }, () => {
    esClient.indices.create({ index: 'drugs' }, () => {
      esClient.indices.putMapping(drugMapping, () => {
        // insertAllDrugs();
        const stream = Drug.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} drugs.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
