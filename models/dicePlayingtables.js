const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionName = 'dicePlayingTables';
const BetLists = require('../models/dicebetLists');


const PlayingTablesSchema = new Schema({
    gameId: { type: String, default: "" },
    gameType: { type: String, default: "Simple" },
    maxSeat: { type: Number, default: 2 },
    activePlayer: { type: Number, default: 0 },
    betId: { type: mongoose.Schema.Types.ObjectId, ref: BetLists },
    currentPlayerTurnIndex: { type: Number, default: -1 },

    entryFee: { type: Number, default: 0 },
    dealerSeatIndex: { type: Number, default: -1 },
    turnSeatIndex: { type: Number, default: -1 },
    tableAmount: { type: Number, default: 0 },
    commission: { type: Number, default: 10 },
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
    currentDiceNumber: { type: Number, default: 0 },
    uuid: { type: String, default: "" },
    rendomNumber: { type: Number, default: 0 }
}, { versionKey: false });

module.exports = mongoose.model(collectionName, PlayingTablesSchema, collectionName);
