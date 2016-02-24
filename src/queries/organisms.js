/* eslint no-param-reassign:0 */
import _debug from 'debug';
import each from 'lodash/each';
import mongoose from 'mongoose';

import { esClient, Organism } from '../models';
// import organismSynonyms from '../../data/organismMergeSynonyms';

const debug = _debug('server:queries:organisms');

export function insertIntoDb(organisms) {
  debug('Attempting to insert organisms...');
  return new Promise((resolve, reject) => {
    Organism.insertMany(organisms, (err) => {
      if (err) {
        reject(err);
      } else {
        debug(`Inserted ${organisms.length} organisms.`);
        resolve();
      }
    });
  });
}

export function insertFromAttrs(attrs) {
  let organisms = [];
  const numToInsert = Object.keys(attrs).length;
  let numLeft = numToInsert;
  const promises = [];
  return new Promise((resolve) => {
    each(attrs, ({ name, type, url, description, id }) => {
      if (/[a-zA-Z]/.test(name)) {
        const _id = new mongoose.Types.ObjectId;
        organisms.push({
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
      if (organisms.length > 4999) {
        promises.push(insertIntoDb(organisms));
        organisms = [];
        return;
      }
      numLeft--;
      // debug(`There are ${numLeft} organisms left.`);
    });
    promises.push(insertIntoDb(organisms));
    Promise
      .all(promises)
      .then(() => {
        resolve();
      });
  });
}

export function insertAllOrganisms() {
  Organism.remove({}, () => {
    insertFromAttrs(require('../../data/organismMergeAttributes'))
      .then(() => insertFromAttrs(require('../../data/organismMergeAttributes2')))
          .then(() => insertFromAttrs(require('../../data/organismMergeAttributes3')))
            .then(() => insertFromAttrs(require('../../data/organismMergeAttributes4')))
              .then(() => debug('Finished inserting organisms.'));
  });
}

const organismMapping = {
  index: 'organisms',
  type: 'organism',
  body: {
    organism: {
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
  esClient.indices.delete({ index: 'organisms' }, () => {
    esClient.indices.create({ index: 'organisms' }, () => {
      esClient.indices.putMapping(organismMapping, () => {
        // insertAllOrganisms();
        const stream = Organism.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} organisms.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
