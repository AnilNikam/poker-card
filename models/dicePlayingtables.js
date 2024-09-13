const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'dicePlayingTables';

const PlayingTablesSchema = new Schema({
    gameId: { type: String, default: "" },
    activePlayer: { type: Number, default: 0 },
    playerInfo: [],
    gameState: { type: String, default: "" },
    turnStartTimer: { type: Date },
    jobId: { type: String, default: "" },
    turnDone: { type: Boolean, default: false },
    gameTimer: {},
    gameTracks: [],
    callFinalWinner: { type: Boolean, default: false },
    isLastUserFinish: { type: Boolean, default: false },
    isFinalWinner: { type: Boolean, default: false },
    history: [],
    betamount: [],
    entryFee: { type: Number, default: 0 },
    currentDiceNumber: { type: Number, default: 0 },
    uuid: { type: String, default: "" },
    rendomNumber: { type: Number, default: 0 }
}, { versionKey: false });

module.exports = mongoose.model(collectionName, PlayingTablesSchema, collectionName);
