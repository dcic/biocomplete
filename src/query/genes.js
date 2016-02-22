/* eslint no-param-reassign:0 */
import _debug from 'debug';
import fs from 'fs';
import parse from 'csv-parse';

import { esClient, Gene } from './models';

const debug = _debug('server:queries:genes');

export function insertAllGenes() {
  Gene.remove({}, () => {
    debug('Reading DRON.csv...');
    const genesCSV = fs.readFileSync('data/DRON.csv').toString();
    debug('Parsing DRON.csv...');
    parse(genesCSV, (err, genes) => {
      genes.forEach((geneArr, index) => {
        const ontologyId = geneArr[0];
        const name = geneArr[1];
        // Skip if at first row of file or if name doesn't contain letters
        if (index === 0 || !/[a-zA-Z]/.test(name)) {
          return;
        }
        Gene.create({
          name,
          suggest: {
            input: name,
            output: name,
          },
          ontologyId,
        }, (createErr, gene) => {
          if (createErr) {
            debug(`Error occurred inserting gene: ${createErr}`);
          } else {
            gene.suggest.payload = {
              _id: gene._id,
            };
            gene.save((saveErr) => {
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
        insertAllGenes();
        const stream = Gene.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} genes.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
