import mongoose, { Schema } from 'mongoose';
import _debug from 'debug';

const debug = _debug('server:models');
debug('Requiring models and connecting to elastic search instances...');

const entitySchema = new Schema({
  name: {
    type: String,
    index: {
      required: true,
      unique: true,
    },
  },
  ontologyId: String,
  type: String,
  url: String,
  description: String,
});

export const Assay = mongoose.model('Assay', entitySchema);
export const CellLine = mongoose.model('CellLine', entitySchema);
export const Disease = mongoose.model('Disease', entitySchema);
export const Drug = mongoose.model('Drug', entitySchema);
export const Gene = mongoose.model('Gene', entitySchema);
export const Organism = mongoose.model('Organism', entitySchema);
