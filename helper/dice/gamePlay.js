const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model('dicePlayingTables');

const CONST = require('../../constant');
const logger = require('../../logger');
const commandAcions = require('../../helper/socketFunctions');

const roundStartActions = require('./roundStart');
const gameFinishActions = require('./gameFinish');
const checkWinnerActions = require('./checkWinner');
const checkUserCardActions = require('./checkUserCard');
const walletActions = require('../common-function/walletTrackTransaction');
const { getRandomNumber } = require('../helperFunction');

module.exports.getNumber = async (requestData, client) => {
    try {
        logger.info('chal requestData : ', requestData);
        if (typeof client.tbid == 'undefined' || typeof client.uid == 'undefined' || typeof client.seatIndex == 'undefined') {
            commandAcions.sendDirectEvent(client.sck, CONST.GET_DICE_NUMBER, requestData, false, 'User session not set, please restart game!');
            return false;
        }
        if (typeof client.dice != 'undefined' && client.dice) return false;

        client.dice = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
        };
        const project = {};
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info('get Dice Number tabInfo : ', tabInfo);

        if (tabInfo == null) {
            logger.info('get Dice Number user not turn ::', tabInfo);
            delete client.dice;
            return false;
        }
        if (tabInfo.turnDone) {
            logger.info('get Dice Number : client.su ::', client.seatIndex);
            delete client.dice;
            commandAcions.sendDirectEvent(client.sck, CONST.GET_DICE_NUMBER, requestData, false, 'Turn is already taken!');
            return false;
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info('get Dice Number : client.su ::', client.seatIndex);
            delete client.dice;
            commandAcions.sendDirectEvent(client.sck, CONST.GET_DICE_NUMBER, requestData, false, "It's not your turn!");
            return false;
        }

        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        logger.info('\n PlayerInfo ::', playerInfo);
        logger.info('\n playerInfo.playerStatus  ==>', playerInfo.playerStatus);

        let currentBet = Number(tabInfo.chalValue);
        logger.info('get Number currentBet ::', currentBet);

        let gwh = {
            _id: MongoID(client.uid),
        };
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info('chal UserInfo : ', gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {},
            $inc: {},
        };

        // let chalvalue = tabInfo.chalValue;
        // logger.info("1 Before chal chalvalue ::", chalvalue);

        let numberFetch = getRandomNumber(1, 10);

        updateData.$set['playerInfo.$.cuurentDiceNumber'] = numberFetch;
        updateData.$inc['cuurentDiceNumber'] = numberFetch;
        updateData.$set['turnDone'] = true;

        //clear the Schedule
        // commandAcions.clearJob(tabInfo.jobId);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            'playerInfo.seatIndex': Number(client.seatIndex),
        };
        logger.info('chal upWh updateData :: ', upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info('chal tb : ', tb);

        let response = {
            number: numberFetch,
            playerId: client.uid,
        };
        commandAcions.sendEventInTable(tb._id.toString(), CONST.GET_DICE_NUMBER, response);
        delete client.dice;

        logger.info("playerInfo.selectedDiceNumber", playerInfo.selectedDiceNumber)
        logger.info("numberFetch", numberFetch)
        logger.info("Number(playerInfo.selectedDiceNumber) == Number(numberFetch)", Number(playerInfo.selectedDiceNumber) == Number(numberFetch))

        if (Number(playerInfo.selectedDiceNumber) == Number(numberFetch)) {
            // await checkWinnerActions.autoShow(tb);
            //wiining Code
            let updateData1 = {
                $set: {},
                $inc: {},
            };
            const upWhr = {
                _id: MongoID(client.tbid.toString()),
                'playerInfo.seatIndex': Number(client.seatIndex),
            };
            logger.info('upWh updateData :: ', upWhr, updateData1);
            updateData1.$set['playerInfo.$.playerStatus'] = "win";


            const tbl = await PlayingTables.findOneAndUpdate(upWh, updateData1, { new: true });
            logger.info('cupdate tb : ', tbl);

            await gameFinishActions.winnerDeclareCall(playerInfo, tbl);
        } else {
            let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
            logger.info('chal activePlayerInRound :', activePlayerInRound, activePlayerInRound.length);

            if (activePlayerInRound.length == 1) {
                await gameFinishActions.lastUserWinnerDeclareCall(tb);
            } else {
                await roundStartActions.nextUserTurnstart(tb);
            }
        }
        return true;
    } catch (e) {
        logger.info('Exception chal : ', e);
    }
};

module.exports.selectDiceNumber = async (requestData, client) => {
    try {
        logger.info('selectDiceNumber requestData : ', requestData);
        if (typeof client.tbid == 'undefined' || typeof client.uid == 'undefined' || typeof client.seatIndex == 'undefined') {
            commandAcions.sendDirectEvent(client.sck, CONST.SELECT_DICE_NUMBER, requestData, false, 'User session not set, please restart game!');
            return false;
        }
        if (typeof client.selectDice != 'undefined' && client.selectDice) return false;

        client.selectDice = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
        };
        const project = {};
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info('selectDiceNumber tabInfo : ', tabInfo);

        if (tabInfo == null) {
            logger.info('selectDiceNumber user not turn ::', tabInfo);
            delete client.selectDice;
            return false;
        }
        if (tabInfo.turnDone) {
            logger.info('selectDiceNumber : client.su ::', client.seatIndex);
            delete client.selectDice;
            commandAcions.sendDirectEvent(client.sck, CONST.SELECT_DICE_NUMBER, requestData, false, 'Turn is already taken!');
            return false;
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info('selectDiceNumber : client.su ::', client.seatIndex);
            delete client.selectDice;
            commandAcions.sendDirectEvent(client.sck, CONST.SELECT_DICE_NUMBER, requestData, false, "It's not your turn!");
            return false;
        }

        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        logger.info('\n selectDiceNumber Bet PlayerInfo ::', playerInfo);
        logger.info('\n playerInfo.isSee  ==>', playerInfo.isSee);
        logger.info('\n playerInfo.playerStatus  ==>', playerInfo.playerStatus);

        let gwh = {
            _id: MongoID(client.uid),
        };
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info('selectDiceNumber UserInfo : ', gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {},
            $inc: {},
        };

        // let chalvalue = tabInfo.chalValue;
        // logger.info("1 Before chal chalvalue ::", chalvalue);

        let selectedDiceNumber = requestData.selectedDiceNumber;
        playerInfo.dice.push(selectedDiceNumber);

        updateData.$set['playerInfo.$.selectedDiceNumber'] = selectedDiceNumber;
        updateData.$set['playerInfo.$.slectDice'] = true;
        updateData.$set['turnDone'] = true;
        // updateData.$set["playerInfo"] = playerInfo;

        //clear the Schedule
        // commandAcions.clearJob(tabInfo.jobId);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            'playerInfo.seatIndex': Number(client.seatIndex),
        };
        logger.info('selectDiceNumber upWh updateData :: ', upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info('selectDiceNumber tb : ', tb);

        let response = {
            numberSaved: true,
            playerId: client.uid,
            diceNumber: requestData.selectedDiceNumber,
        };
        commandAcions.sendEventInTable(tb._id.toString(), CONST.SELECT_DICE_NUMBER, response);
        delete client.selectDice;

        let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        logger.info('chal activePlayerInRound :', activePlayerInRound, activePlayerInRound.length);
        if (activePlayerInRound.length == 1) {
            await gameFinishActions.lastUserWinnerDeclareCall(tb);
        } else {
            await roundStartActions.nextUserTurnstart(tb);
        }
        return true;
    } catch (e) {
        logger.info('Exception chal : ', e);
    }
};

module.exports.show = async (requestData, client) => {
    try {
        logger.info('show requestData : ', requestData);
        if (typeof client.tbid == 'undefined' || typeof client.uid == 'undefined' || typeof client.seatIndex == 'undefined') {
            commandAcions.sendDirectEvent(client.sck, CONST.TEEN_PATTI_SHOW, requestData, false, 'User session not set, please restart game!');
            return false;
        }
        if (typeof client.show != 'undefined' && client.show) return false;

        client.show = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
        };
        const project = {};
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info('show tabInfo : ', tabInfo);

        if (tabInfo == null) {
            logger.info('show user not turn ::', tabInfo);
            delete client.show;
            return false;
        }
        if (tabInfo.turnDone) {
            logger.info('chal : client.su ::', client.seatIndex);
            delete client.chal;
            commandAcions.sendDirectEvent(client.sck, CONST.GET_DICE_NUMBER, requestData, false, 'Turn is already taken!');
            return false;
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info('show : client.su ::', client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.TEEN_PATTI_SHOW, requestData, false, "It's not your turn!");
            return false;
        }

        const playerInGame = await roundStartActions.getPlayingUserInRound(tabInfo.playerInfo);
        logger.info('show userTurnExpaire playerInGame ::', playerInGame);

        if (playerInGame.length != 2) {
            logger.info('show : client.su ::', client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.TEEN_PATTI_SHOW, requestData, false, 'Not valid show!!');
            return false;
        }

        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        logger.info('show playerInfo ::', playerInfo);

        let currentBet = Number(tabInfo.chalValue);
        logger.info('show currentBet ::', currentBet);

        let gwh = {
            _id: MongoID(client.uid),
        };
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info('show UserInfo : ', gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {},
            $inc: {},
        };
        let chalvalue = tabInfo.chalValue;

        if (typeof requestData.isIncrement != 'undefined' && requestData.isIncrement) {
            chalvalue = chalvalue * 2;
        }
        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips);
        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info('show client.su :: ', client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.TEEN_PATTI_SHOW, requestData, false, 'Please add wallet!!');
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2));

        // await walletActions.deductWallet(client.uid, -chalvalue, 3, "TeenPatti show", tabInfo, client.id, client.seatIndex);
        await walletActions.deductuserWallet(client.uid, -chalvalue, CONST.TRANSACTION_TYPE.DEBIT, 'TeenPatti show', 'TeenPatti', tabInfo, client.id, client.seatIndex);

        updateData.$set['chalValue'] = chalvalue;
        updateData.$inc['potValue'] = chalvalue;

        //clear jobId schudle
        commandAcions.clearJob(tabInfo.jobId);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            'playerInfo.seatIndex': Number(client.seatIndex),
        };
        logger.info('show upWh updateData :: ', upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info('show tb :: ', tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            chalValue: chalvalue,
        };
        commandAcions.sendEventInTable(tb._id.toString(), CONST.TEEN_PATTI_SHOW, response);
        delete client.show;
        await checkWinnerActions.winnercall(tb, true, tb.turnSeatIndex);
        return true;
    } catch (e) {
        logger.info('Exception chal : ', e);
    }
};

module.exports.cardPack = async (requestData, client) => {
    try {
        logger.info('PACK requestData : ', requestData);
        if (typeof client.tbid == 'undefined' || typeof client.uid == 'undefined' || typeof client.seatIndex == 'undefined') {
            commandAcions.sendDirectEvent(client.sck, CONST.TEEN_PATTI_PACK, requestData, false, 'User session not set, please restart game!');
            return false;
        }
        if (typeof client.pack != 'undefined' && client.pack) return false;

        client.pack = true;

        const wh = {
            _id: MongoID(client.tbid.toString()),
        };
        const project = {};
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info('PACK tabInfo : ', tabInfo);

        if (tabInfo == null) {
            logger.info('PACK user not turn ::', tabInfo);
            delete client.pack;
            return false;
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info('PACK : client.su ::', client.seatIndex);
            delete client.pack;
            commandAcions.sendDirectEvent(client.sck, CONST.TEEN_PATTI_PACK, requestData, false, "It's not your turn!", 'Error!');
            return false;
        }
        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        //clear schedule job
        commandAcions.clearJob(tabInfo.jobId);

        let winner_state = checkUserCardActions.getWinState(playerInfo.cards, tabInfo.hukum);
        let userTrack = {
            _id: playerInfo._id,
            username: playerInfo.username,
            cards: playerInfo.cards,
            seatIndex: client.seatIndex,
            totalBet: playerInfo.totalBet,
            playerStatus: 'pack',
            winningCardStatus: winner_state.status,
        };

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            'playerInfo.seatIndex': Number(client.seatIndex),
        };
        const updateData = {
            $set: {
                'playerInfo.$.status': 'pack',
                'playerInfo.$.playerStatus': 'pack',
            },
            $push: {
                gameTracks: userTrack,
            },
        };
        logger.info('PACK upWh updateData :: ', upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info('PACK tb : ', tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
        };
        commandAcions.sendEventInTable(tb._id.toString(), CONST.TEEN_PATTI_PACK, response);

        let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        logger.info('PACK activePlayerInRound :', activePlayerInRound, activePlayerInRound.length);
        if (activePlayerInRound.length == 1) {
            await gameFinishActions.lastUserWinnerDeclareCall(tb);
        } else {
            await roundStartActions.nextUserTurnstart(tb);
        }
        return true;
    } catch (e) {
        logger.info('Exception PACK : ', e);
    }
};

module.exports.seeCard = async (requestData, client) => {
    try {
        logger.info('seeCard requestData : ', requestData);
        if (typeof client.tbid == 'undefined' || typeof client.uid == 'undefined' || typeof client.seatIndex == 'undefined') {
            commandAcions.sendDirectEvent(client.sck, CONST.TEEN_PATTI_CARD_SEEN, requestData, false, '1000', 'User session not set, please restart game!', 'Error!');
            return false;
        }
        const wh = {
            _id: MongoID(client.tbid.toString()),
            'playerInfo.seatIndex': Number(client.seatIndex),
        };
        const project = {};
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info('seeCard tabInfo : ', tabInfo);

        if (tabInfo == null) {
            logger.info('seeCard user not turn ::', tabInfo);
            return false;
        }
        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            'playerInfo.seatIndex': Number(client.seatIndex),
        };
        const updateData = {
            $set: {
                'playerInfo.$.isSee': true,
            },
        };
        logger.info('seeCard upWh updateData :: ', upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info('seeCard tb : ', tb);

        let response = {
            cards: playerInfo.cards,
        };
        commandAcions.sendEvent(client, CONST.TEEN_PATTI_SEE_CARD_INFO, response);
        let isShow = await roundStartActions.checShowButton(tb.playerInfo, client.seatIndex);

        let response1 = {
            seatIndex: client.seatIndex,
            isShow: isShow,
        };
        commandAcions.sendEventInTable(tb._id.toString(), CONST.TEEN_PATTI_CARD_SEEN, response1);

        return true;
    } catch (e) {
        logger.info('Exception seeCard : ', e);
    }
};
