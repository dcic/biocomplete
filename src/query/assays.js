/* eslint no-param-reassign:0 */
import fs from 'fs';
import _debug from 'debug';
import parse from 'csv-parse';
import { esClient, Assay } from './models';

const debug = _debug('server:queries:assays');

export function insertAllAssays() {
  Assay.remove({}, () => {
    const assaysCSV = fs.readFileSync('data/BAO.csv').toString();
    parse(assaysCSV, (err, assays) => {
      assays.forEach((assayArr, index) => {
        const ontologyId = assayArr[0];
        const name = assayArr[1];
        // Skip first row of file
        if (index === 0) {
          return;
        }
        Assay.create({
          name,
          suggest: {
            input: name,
            output: name,
          },
          ontologyId,
        }, (createErr, assay) => {
          if (createErr) {
            debug(`Error occurred inserting assay: ${createErr}`);
          } else {
            assay.suggest.payload = {
              _id: assay._id,
            };
            assay.save((saveErr) => {
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

const assayMapping = {
  index: 'assays',
  type: 'assay',
  body: {
    assay: {
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
  esClient.indices.delete({ index: 'assays' }, () => {
    esClient.indices.create({ index: 'assays' }, () => {
      esClient.indices.putMapping(assayMapping, () => {
        insertAllAssays();
        const stream = Assay.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} assays.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
