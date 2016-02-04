import fs from 'fs';
import _ from 'lodash';
import _debug from 'debug';
import parse from 'csv-parse';

import { Assay, CellLine } from './models';
import cellAttributes from '../data/cellTissueAttributes';
import cellSynonyms from '../data/cellTissueSynonyms';

const debug = _debug('server:queries');

export function insertAllCellLines() {
  let numLeft = Object.keys(cellAttributes).length;

  _.each(cellAttributes, ({ name, type, url, description, id }) => {
    CellLine.create({
      name,
      type,
      url,
      description,
      ontologyId: id,
    }, (err) => {
      if (err) {
        debug(`Error occurred inserting cell line: ${err}`);
      } else {
        debug(`Entered cell line with name: ${name}`);
        numLeft--;
        debug(`There are ${numLeft} cell lines left to insert.`);
      }
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
  const assaysCSV = fs.readFileSync('data/BAO.csv').toString();
  parse(assaysCSV, (err, assays) => {
    _.each(assays, (assayArr, index) => {
      const ontologyId = assayArr[0];
      const name = assayArr[1];
      // Skip first row of file
      if (index === 0) {
        return;
      }
      Assay.create({ name, ontologyId }, (createErr) => {
        if (createErr) {
          debug(`Error occurred inserting cell line: ${createErr}`);
        } else {
          debug(`Entered assay with name: ${name}`);
        }
      });
    });
  });
}

export default () => {
  // esClient.indices.delete({ index: '_all' }, () => {
  //   insertAllAssays();
  //   insertAllCellLines();
  // });
};
