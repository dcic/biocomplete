/* eslint no-param-reassign:0 */
import _debug from 'debug';
import fs from 'fs';
import parse from 'csv-parse';

import { esClient, Disease } from './models';

const debug = _debug('server:queries:diseases');

export function insertAllDiseases() {
  Disease.remove({}, () => {
    debug('Reading DRON.csv...');
    const diseasesCSV = fs.readFileSync('data/DRON.csv').toString();
    debug('Parsing DRON.csv...');
    parse(diseasesCSV, (err, diseases) => {
      diseases.forEach((diseaseArr, index) => {
        const ontologyId = diseaseArr[0];
        const name = diseaseArr[1];
        // Skip if at first row of file or if name doesn't contain letters
        if (index === 0 || !/[a-zA-Z]/.test(name)) {
          return;
        }
        Disease.create({
          name,
          suggest: {
            input: name,
            output: name,
          },
          ontologyId,
        }, (createErr, disease) => {
          if (createErr) {
            debug(`Error occurred inserting disease: ${createErr}`);
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
