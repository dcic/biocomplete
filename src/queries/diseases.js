/* eslint no-param-reassign:0 */
import _debug from 'debug';
import each from 'lodash/each';

import { esClient, Disease } from '../models';
const debug = _debug('server:queries:diseases');

debug('Importing attributes...');
import diseaseAttributes from '../../data/diseaseMergeAttributes';
debug('Finished importing attributes.');
// import diseaseSynonyms from '../../data/diseaseMergeSynonyms';


export function insertAllDiseases() {
  Disease.remove({}, () => {
    each(diseaseAttributes, ({ name, type, url, description, id }) => {
      Disease.create({
        name,
        suggest: {
          input: name,
          output: name,
        },
        type,
        url,
        description,
        ontologyId: id,
      }, (err, disease) => {
        if (err) {
          debug(`Error occurred inserting disease: ${err}`);
        } else {
          disease.suggest.payload = {
            _id: disease._id,
          };
          disease.save((saveErr) => {
            if (saveErr) {
              debug(saveErr);
            }
          });
        }
      });
    });
  });
}

const diseaseMapping = {
  index: 'diseases',
  type: 'disease',
  body: {
    disease: {
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
  esClient.indices.delete({ index: 'diseases' }, () => {
    esClient.indices.create({ index: 'diseases' }, () => {
      esClient.indices.putMapping(diseaseMapping, () => {
        insertAllDiseases();
        const stream = Disease.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} diseases.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
