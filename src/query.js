/* eslint no-unused-vars:0 */
import fs from 'fs';
import _ from 'lodash';
import _debug from 'debug';
import parse from 'csv-parse';

import { esClient, Assay, CellLine } from './models';
import cellAttributes from '../data/cellTissueAttributes';
import cellSynonyms from '../data/cellTissueSynonyms';

const debug = _debug('server:queries');

export function insertAllCellLines() {
  CellLine.remove({}, () => {
    const total = 100;
    _.each(cellAttributes, ({ name, type, url, description, id }) => {
      CellLine.create({
        name,
        suggest: {
          input: name,
          output: name,
        },
        type,
        url,
        description,
        ontologyId: id,
      }, (err, cellLine) => {
        if (err) {
          debug(`Error occurred inserting cell line: ${err}`);
        } else {
          cellLine.suggest.payload = {
            _id: cellLine._id,
          };
          cellLine.save((saveErr) => {
            if (saveErr) {
              debug(saveErr);
            }
          });
        }
      });
    });
  });
}

export function generateSynonymsFile() {
  const synonyms = {};

  _.each(cellSynonyms, (cellSynObj) => {
    if (_.has(synonyms, cellSynObj.name)) {
      synonyms[cellSynObj.name].push(cellSynObj.synonym);
    } else {
      synonyms[cellSynObj.name] = [cellSynObj.synonym];
    }
  });

  const esSynonyms = [];

  _.each(synonyms, (synArr, cell) => {
    esSynonyms.push(`${synArr.join(',')} => ${cell}`);
  });

  const file = fs.createWriteStream('esSynonyms.txt');
  esSynonyms.forEach((v) => file.write(`"${v}",\n`));
  file.end();
}

export function insertAllAssays() {
  Assay.remove({}, () => {
    const assaysCSV = fs.readFileSync('data/BAO.csv').toString();
    parse(assaysCSV, (err, assays) => {
      _.each(assays, (assayArr, index) => {
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
            debug(`Error occurred inserting cell line: ${createErr}`);
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

const cellLineMapping = {
  index: 'celllines',
  type: 'cellline',
  body: {
    cellline: {
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
  // esClient.indices.delete({ index: '_all' }, () => {
  //   esClient.indices.create({ index: 'celllines' }, () => {
  //     esClient.indices.putMapping(cellLineMapping, () => {
  //       // insertAllCellLines();
        let stream = CellLine.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug('indexed ' + count + ' documents!'));
        stream.on('error', (err) => debug(err));
  //     });
  //   });
  //   esClient.indices.create({ index: 'assays' }, () => {
  //     esClient.indices.putMapping(assayMapping, () => {
  //       // insertAllAssays();
        // stream = Assay.synchronize();
        // count = 0;
        // stream.on('data', () => count++);
        // stream.on('close', () => debug('indexed ' + count + ' documents!'));
        // stream.on('error', (err) => debug(err));
  //     });
  //   });
  // });
};
