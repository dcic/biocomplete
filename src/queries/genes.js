/* eslint no-param-reassign:0 */
import _debug from 'debug';
import each from 'lodash/each';
import mongoose from 'mongoose';

import { esClient, Gene } from '../models';

import geneAttributes from '../../data/geneMergeAttributes';
// import geneSynonyms from '../../data/geneMergeSynonyms';

const debug = _debug('server:queries:genes');
const genes = [];

export function insertAllGenes() {
  Gene.remove({}, () => {
    let genesLeft = Object.keys(geneAttributes).length;
    each(geneAttributes, ({ name, type, url, description, id }) => {
      if (/[a-zA-Z]/.test(name)) {
        const _id = new mongoose.Types.ObjectId;
        genes.push({
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
      genesLeft--;
      debug(`There are ${genesLeft} genes left.`);
    });
    Gene.insertMany(genes, (err) => {
      if (err) {
        debug(err);
      }
    });
  });
}

const geneMapping = {
  index: 'genes',
  type: 'gene',
  body: {
    gene: {
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
  esClient.indices.delete({ index: 'genes' }, () => {
    esClient.indices.create({ index: 'genes' }, () => {
      esClient.indices.putMapping(geneMapping, () => {
        // insertAllGenes();
        const stream = Gene.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} genes.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
