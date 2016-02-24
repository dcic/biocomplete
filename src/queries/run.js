/* eslint no-unused-vars:0 no-param-reassign:0 */
import fs from 'fs';
import _ from 'lodash';
import _debug from 'debug';

const debug = _debug('server:queries');

export function generateSynonymsFile() {
  const synonyms = {};

  _.each(require('../../data/cellTissueSynonyms'), (cellSynObj) => {
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

export default () => {
  debug('Running queries...');

  require('./assays').default();
  // require('./cellLines').default();
  // require('./diseases').default();
  // require('./drugs').default();
  // require('./genes').default();
  // require('./organisms').default();
};
