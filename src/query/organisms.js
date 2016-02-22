/* eslint no-param-reassign:0 */
import _debug from 'debug';
import fs from 'fs';
import parse from 'csv-parse';

import { esClient, Organism } from './models';

const debug = _debug('server:queries:organisms');

export function insertAllOrganisms() {
  Organism.remove({}, () => {
    debug('Reading DRON.csv...');
    const organismsCSV = fs.readFileSync('data/DRON.csv').toString();
    debug('Parsing DRON.csv...');
    parse(organismsCSV, (err, organisms) => {
      organisms.forEach((organismArr, index) => {
        const ontologyId = organismArr[0];
        const name = organismArr[1];
        // Skip if at first row of file or if name doesn't contain letters
        if (index === 0 || !/[a-zA-Z]/.test(name)) {
          return;
        }
        Organism.create({
          name,
          suggest: {
            input: name,
            output: name,
          },
          ontologyId,
        }, (createErr, organism) => {
          if (createErr) {
            debug(`Error occurred inserting organism: ${createErr}`);
          } else {
            organism.suggest.payload = {
              _id: organism._id,
            };
            organism.save((saveErr) => {
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
        insertAllOrganisms();
        const stream = Organism.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} organisms.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
