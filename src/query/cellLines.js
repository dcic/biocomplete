/* eslint no-param-reassign:0 */
import _debug from 'debug';

import { esClient, CellLine } from './models';
import cellAttributes from '../data/cellTissueAttributes';
// import cellSynonyms from '../data/cellTissueSynonyms';

const debug = _debug('server:queries:cellLines');

export function insertAllCellLines() {
  CellLine.remove({}, () => {
    cellAttributes.forEach(({ name, type, url, description, id }) => {
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
