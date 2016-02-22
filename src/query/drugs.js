/* eslint no-param-reassign:0 */
import _debug from 'debug';
import fs from 'fs';
import parse from 'csv-parse';
import { esClient, Drug } from './models';

const debug = _debug('server:queries:drugs');

export function insertAllDrugs() {
  Drug.remove({}, () => {
    debug('Reading DRON.csv...');
    const drugsCSV = fs.readFileSync('data/DRON.csv').toString();
    debug('Parsing DRON.csv...');
    parse(drugsCSV, (err, drugs) => {
      drugs.forEach((drugArr, index) => {
        const ontologyId = drugArr[0];
        const name = drugArr[1];
        // Skip if at first row of file or if name doesn't contain letters
        if (index === 0 || !/[a-zA-Z]/.test(name)) {
          return;
        }
        Drug.create({
          name,
          suggest: {
            input: name,
            output: name,
          },
          ontologyId,
        }, (createErr, drug) => {
          if (createErr) {
            debug(`Error occurred inserting drug: ${createErr}`);
          } else {
            drug.suggest.payload = {
              _id: drug._id,
            };
            drug.save((saveErr) => {
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
        insertAllDrugs();
        const stream = Drug.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} drugs.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
