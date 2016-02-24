/* eslint no-param-reassign:0 */
import _debug from 'debug';
import each from 'lodash/each';

import { esClient, CellLine } from '../models';
const debug = _debug('server:queries:cellLines');

debug('Importing cell attributes...');
import cellAttributes from '../../data/cellTissueAttributes';
debug('Finished importing cell attributes.');
// import cellSynonyms from '../../data/cellTissueSynonyms';


export function insertAllCellLines() {
  CellLine.remove({}, () => {
    each(cellAttributes, ({ name, type, url, description, id }) => {
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

export default () => {
  esClient.indices.delete({ index: 'celllines' }, () => {
    esClient.indices.create({ index: 'celllines' }, () => {
      esClient.indices.putMapping(cellLineMapping, () => {
        insertAllCellLines();
        const stream = CellLine.synchronize();
        let count = 0;
        stream.on('data', () => count++);
        stream.on('close', () => debug(`Indexed ${count} cell lines.`));
        stream.on('error', (err) => debug(err));
      });
    });
  });
};
