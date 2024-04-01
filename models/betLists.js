const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'betLists';

const BetListSchema = new Schema(
  {
    tableName: { type: String, default: '' },
    entryFee: { type: String },//bet
    commission: { type: Number, default: 10 },
    maxSeat: { type: Number, default: 6 },
    status: { type: String, default: 'Active' },
    expireIn: { type: Number },
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
    smallblind: { type: Number, default: 0 },
    bigblind:{ type: Number, default: 0 },
  },
  {
    versionKey: false,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(collectionName, BetListSchema, collectionName);
