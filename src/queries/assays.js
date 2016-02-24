/* eslint no-param-reassign:0 */
import fs from 'fs';
import _debug from 'debug';
import parse from 'csv-parse';
import { Assay } from '../models';

const debug = _debug('server:queries:assays');

export default function insertAllAssays() {
  Assay.remove({}, () => {
    const assaysCSV = fs.readFileSync('data/BAO.csv').toString();
    parse(assaysCSV, (err, assays) => {
      if (err) {
        debug(err);
      }
      const assaysToInsert = assays.map((assayArr, index) => {
        const url = assayArr[0];
        const name = assayArr[1];
        const description = assayArr[3];
        // Skip first row of file
        if (index === 0) {
          return {};
        }
        // Split url by /
        let ontologyId = url.split('/');
        // Get the last section of the url
        ontologyId = ontologyId[ontologyId.length - 1];
        // Some urls look like http://www.bioassayontology.org/bao#BAO_0002720
        // We just want BAO_0002720
        ontologyId = ontologyId.split('#');
        // This will be the proper id regardless of whether or not a # exists
        ontologyId = ontologyId[ontologyId.length - 1];

        return {
          name,
          url,
          type: 'assay',
          ontologyId,
          description,
        };
      });
      Assay.insertMany(assaysToInsert, (insertErr, docs) => {
        if (insertErr) {
          debug(insertErr);
        } else {
          debug(`Inserted ${docs.length} assays.`);
        }
      });
    });
  });
}
