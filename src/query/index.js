/* eslint no-unused-vars:0 no-param-reassign:0 */
import fs from 'fs';
import _ from 'lodash';
import _debug from 'debug';

import cellSynonyms from '../data/cellTissueSynonyms';
import runAssayQueries from './assays';
import runCellLineQueries from './cellLines';
import runDiseaseQueries from './diseases';
import runDrugQueries from './drugs';
import runGeneQueries from './genes';
import runOrganismQueries from './organisms';

const debug = _debug('server:queries');

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

export default () => {
  debug('Running queries...');

  // runAssayQueries();
  // runCellLineQueries();
  // runDiseaseQueries();
  // runDrugQueries();
  // runGeneQueries();
  // runOrganismQueries();
};
