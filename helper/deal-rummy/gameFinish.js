const mongoose = require('mongoose');
const Users = mongoose.model('users');
const BetLists = mongoose.model('dealbetLists');
const PlayingTables = mongoose.model('rummyPlayingTables');
const TableHistory = mongoose.model('tableHistory');
const Commission = mongoose.model('commissions');
const MongoID = mongoose.Types.ObjectId;
const { omit } = require('lodash');

const CONST = require('../../constant');
const logger = require('../../logger');
const gameTrackActions = require('../common-function/rummyGameTrack');
const commandAcions = require('../socketFunctions');
const roundEndActions = require('./roundEnd');
const commonHelper = require('../commonHelper');
const { getScore } = require('../common-function/cardFunction');
const walletActions = require('../common-function/walletTrackTransaction');
const { getPlayingUserInRound /*, getPlayingInTable*/, winnerViewResponseFilter, getPlayingAndDropUserRound } = require('../common-function/manageUserFunction');

module.exports.lastUserWinnerDeclareCall = async (tblInfo) => {
  const tb = tblInfo;
  logger.info('last Winner Declare =', tb);
  try {
    if (tb.activePlayer === 1) {
      logger.info('last Winner Declare tb.activePlayer=', tb.activePlayer);
      let tbid = tb._id.toString();

      if (tb.isLastUserFinish) {
        return false;
      }

      if (tb.gameState === CONST.ROUND_END) {
        return false;
      }

      if (tb.isFinalWinner) {
        return false;
      }

      let updateData = {
        $set: {},
        $inc: {},
      };

      let amount = (tb.tableAmount * CONST.POOL_COMMISSION) / 100;

      let insertobj = {
        tableId: tb._id,
        gamePlayType: tb.gamePlayType,
        CommisonAmount: amount,
      };

      let insertInfo = await Commission.create(insertobj);
      logger.info('lastUserWinnerDeclareCall Commison ->', insertInfo);
      tb.tableAmount -= amount;

      updateData.$set['isFinalWinner'] = true;
      updateData.$set['gameState'] = CONST.ROUND_END;
      updateData.$set['playerInfo.$.playerStatus'] = CONST.WON;
      updateData.$inc['playerInfo.$.gameChips'] = tb.tableAmount;
      updateData.$set['tableAmount'] = tb.tableAmount;

      const upWh = {
        _id: MongoID(tbid),
        'playerInfo.seatIndex': Number(tb.currentPlayerTurnIndex),
      };
      logger.info('upWh --<', upWh);

      const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
      logger.info('\n table info ==>', tbInfo);

      //await this.updateUserScore(tbInfo.playerInfo[tbInfo.currentPlayerTurnIndex].playerId, tbInfo.tableAmount);
      //logger.info('lastUserWinnerDeclareCallTemp  after declare upate user chips =>', updetUserChips);

      await walletActions.addWallet(tbInfo.playerInfo[tbInfo.currentPlayerTurnIndex].playerId, Number(tbInfo.tableAmount), 'Credit', 'Win', 'Game', tbInfo);

      const playerInGame = await getPlayingUserInRound(tbInfo.playerInfo);

      const tableInfo = await PlayingTables.findOne(upWh, {}).lean();

      for (let i = 0; i < playerInGame.length; i++) {
        tableInfo.gameTracks.push({
          _id: playerInGame[i]._id,
          username: playerInGame[i].username,
          seatIndex: playerInGame[i].seatIndex,
          cards: playerInGame[i].cards,
          gCard: playerInGame[i].gCard,
          point: playerInGame[i].point,
          gameChips: playerInGame[i].gameChips,
          gameBet: tableInfo.entryFee,
          result: playerInGame[i].playerStatus === CONST.WON ? CONST.WON : CONST.LOST,
        });
      }

      let allPlayerInGame = await getPlayingUserInRound(tableInfo.playerInfo);
      logger.info('lastUserWinnerDeclareCallTemp Player In Game allPlayerInGame --- --- >', allPlayerInGame);

      const winnerTrack = await gameTrackActions.gamePlayTracks(tableInfo.gameTracks, tableInfo);

      for (let i = 0; i < tableInfo.gameTracks.length; i++) {
        if (tableInfo.gameTracks[i].result === CONST.WON) {

          let winningwallet = Number(winnerTrack.winningAmount)

          await walletActions.addWalletWinngChpis(tableInfo.gameTracks[i]._id, Number(winningwallet), 'Credit', 'Game Win', 'Game', tableInfo);

        }
      }

      const playersScoreBoard = await this.countPlayerScore(tableInfo);
      const winnerViewResponse = winnerViewResponseFilter(playersScoreBoard);
      let lastPoolPoint = winnerViewResponse.userInfo;

      tableInfo.lastPointTable.push(lastPoolPoint);

      const response = {
        playersScoreBoard: winnerViewResponse.userInfo,
        totalLostChips: tableInfo.tableAmount,
        gameStartStatus: true
      };

      const GSBResponse = { ...response, wildCard: tableInfo.wildCard, gamePlayType: tableInfo.gamePlayType };
      tableInfo.lastGameScoreBoard.push(GSBResponse);
      //logger.info('lastUserWinnerDeclareCallTemp addLastScoreBoard ==>', addLastScoreBoard);

      const qu = {
        _id: MongoID(tbid),
      };

      let updatedata = {
        $set: {
          gameTracks: tableInfo.gameTracks,
          lastGameScoreBoard: tableInfo.lastGameScoreBoard,
          lastPointTable: lastPoolPoint,
        },
      };

      await PlayingTables.findOneAndUpdate(qu, updatedata, { new: true });
      //logger.info('lastUserWinnerDeclareCallTemp Pool Table =>', tblInfo);

      commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.WIN, response);

      let jobId = commandAcions.GetRandomString(10);
      let delay = commandAcions.AddTime(4);
      await commandAcions.setDelay(jobId, new Date(delay));

      commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.GAME_SCORE_BOARD, GSBResponse);

      jobId = commandAcions.GetRandomString(10);
      delay = commandAcions.AddTime(5);
      await commandAcions.setDelay(jobId, new Date(delay));

      const gamePlayData = JSON.parse(JSON.stringify(tableInfo));
      const rest = omit(gamePlayData, ['_id']);

      //save table history
      const tableHistory = { ...rest, tableId: tableInfo._id };
      await commonHelper.insert(TableHistory, tableHistory);

      commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.RESTART_GAME_TABLE, { status: 0 });

      let roundTime = CONST.restartTimer;
      let tableId = tableInfo._id;
      let fnsJobId = CONST.RESTART_GAME_TABLE + ':' + tableId;
      let delayed = commandAcions.AddTime(roundTime);

      await commandAcions.setDelay(fnsJobId, new Date(delayed));
      // await roundEndActions.restartTable(tableInfo);

    } else if (tb.activePlayer >= 2) {
      this.winnerDeclareCall(tblInfo);
    }
  } catch (e) {
    logger.error('gameFinish.js lastUserWinnerDeclareCall error => ', e);
  }
};

module.exports.winnerDeclareCall = async (tblInfo) => {
  let tbInfo = tblInfo;
  logger.info('\n winnerDeclareCall tbInfo ->', tbInfo);
  try {
    const tbid = tbInfo._id;

    if (tbInfo.gameState === CONST.ROUND_END) return false;
    if (tbInfo.isFinalWinner) return false;

    let updateData = {
      $set: {},
      $inc: {},
    };

    updateData.$set['isFinalWinner'] = true;
    updateData.$set['gameState'] = CONST.ROUND_END;
    updateData.$set['playerInfo.$.playerStatus'] = CONST.WON;

    let playerSeatIndex = tbInfo.playerInfo[tbInfo.currentPlayerTurnIndex].seatIndex;
    logger.info('Player Seat Index winner Declare call -->', playerSeatIndex);

    const upWh = {
      _id: MongoID(tbid),
      'playerInfo.seatIndex': Number(playerSeatIndex),
    };

    tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });
    logger.info('\ndeal Tb info -->', tbInfo);

    const playerInGame = await getPlayingUserInRound(tbInfo.playerInfo);
    let tableInfo = await this.manageUserScore(playerInGame, tbInfo);
    //let lostPlayerInTable = await getPlayingInTable(tableInfo.playerInfo, tableInfo.gameType);

    const betInfo = await BetLists.findOne({ _id: tableInfo.betId }, {}).lean();
    logger.info('\nDeal betInfo -->', betInfo);
    let betDetails = tableInfo.betId;

    // logger.info('\n betDetails ==>', betDetails);
    logger.info('\n Round ==>', tableInfo.round);

    //check round and bet deal is same and bot users score are same
    let scores = tableInfo.playerInfo.map(player => player.point); // Extracting the scores of all players

    // Checking if all scores in the array are equal
    let allEqual = scores.every((score, index, arr) => score === arr[0]);
    logger.info("All equal ==>", allEqual)

    let checkScore = false
    if (allEqual && betInfo.deal <= tableInfo.round) {
      // Both players have the same score
      // return true;
      checkScore = true
    }

    let gameStartStatus = false;


    //if (betInfo.deal === tableInfo.round) {
    //  logger.info('finish the game');
    //}

    if (betInfo.deal <= tableInfo.round && checkScore == false) {
      let amount = (tableInfo.tableAmount * CONST.POOL_COMMISSION) / 100;
      //logger.info('Amount deduct ->', amount);

      let insertobj = {
        tableId: tableInfo._id,
        gamePlayType: tableInfo.gamePlayType,
        CommisonAmount: amount,
      };

      let insertInfo = await Commission.create(insertobj);
      logger.info('Commison ->', insertInfo);

      tableInfo.tableAmount -= amount;

      //logger.info('tableInfo.tableAmount deduct ->', tableInfo.tableAmount);

      updateData.$inc['playerInfo.$.chips'] = tableInfo.tableAmount;
      updateData.$set['tableAmount'] = tableInfo.tableAmount;

      tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
      logger.info(' Table --->', tableInfo);

      // let updetUserChips = await this.updateUserScore(tableInfo.playerInfo[tableInfo.currentPlayerTurnIndex].playerId, tableInfo.tableAmount);
      // logger.info('Declare upate user chips =>', updetUserChips);
      gameStartStatus = true;
    }

    let playerInGameTrack = await getPlayingUserInRound(tableInfo.playerInfo);

    for (let i = 0; i < playerInGameTrack.length; i++) {
      tableInfo.gameTracks.push({
        _id: playerInGameTrack[i]._id,
        username: playerInGameTrack[i].username,
        seatIndex: playerInGameTrack[i].seatIndex,
        cards: playerInGameTrack[i].cards,
        gCard: playerInGameTrack[i].gCard,
        gameChips: playerInGameTrack[i].gameChips,
        score: playerInGameTrack[i].currentGamePoint,
        point: playerInGameTrack[i].point,
        gameBet: tableInfo.entryFee,
        result: playerInGameTrack[i].playerStatus === CONST.WON ? CONST.WON : CONST.LOST,
      });
    }

    const winnerTrack = await gameTrackActions.gamePlayTracks(tableInfo.gameTracks, tableInfo);
    logger.info('winnerDeclareCall winnerTrack:: ', winnerTrack);

    if (gameStartStatus) {
      logger.info(' Add Win Deal Wallet gameStartStatus', gameStartStatus);
      await walletActions.addWallet(tableInfo.playerInfo[tableInfo.currentPlayerTurnIndex].playerId, Number(winnerTrack.winningAmount), 'Credit', 'Win', 'Game', tableInfo);
    }

    playerInGame.forEach((player) => {
      if (player.playerStatus !== CONST.WON && gameStartStatus) {
        //player.playerStatus = CONST.LOST;
        //player.playerLostChips = tableInfo.entryFee;
        logger.info('Deal last User Winner Declare Call lost counter');
        this.updateLostCounter(player.playerId);
      }
    });

    const playersScoreBoard = await this.countPlayerScore(tableInfo);
    let winnerViewResponse = winnerViewResponseFilter(playersScoreBoard);
    let lastDealPoint = winnerViewResponse.userInfo;

    tableInfo.lastPointTable.push(lastDealPoint);

    const response = {
      playersScoreBoard: winnerViewResponse.userInfo,
      totalLostChips: tableInfo.tableAmount,
      gameStartStatus: gameStartStatus,
      isTie: checkScore
    };

    const gsbResponse = { ...response, wildCard: tableInfo.wildCard, gamePlayType: tableInfo.gamePlayType };
    commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.WIN, response);

    const addLastScoreBoard = tableInfo.lastGameScoreBoard.push(gsbResponse);
    logger.info('addLastScoreBoard Score board ==>', addLastScoreBoard);

    const qu = {
      _id: MongoID(tbid),
    };

    let updatedata = {
      $set: {
        gameTracks: tableInfo.gameTracks,
        lastGameScoreBoard: tableInfo.lastGameScoreBoard,
        lastPointTable: tableInfo.lastPointTable,
      },
    };

    let tblInfo = await PlayingTables.findOneAndUpdate(qu, updatedata, { new: true });

    let jobId = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(2);
    await commandAcions.setDelay(jobId, new Date(delay));

    commandAcions.sendEventInTable(tblInfo._id.toString(), CONST.GAME_SCORE_BOARD, gsbResponse);

    //const playerInRound = await getPlayingUserInRound(tableInfo.playerInfo);

    jobId = commandAcions.GetRandomString(10);
    delay = commandAcions.AddTime(5);
    await commandAcions.setDelay(jobId, new Date(delay));

    //tableInfo = await this.updateExpeledPlayer(playerInRound, tableInfo);

    let gamePlayData = JSON.parse(JSON.stringify(tableInfo));
    const rest = omit(gamePlayData, ['_id']);
    let tableHistory = { ...rest, tableId: tableInfo._id };

    let tableHistoryData = await commonHelper.insert(TableHistory, tableHistory);
    logger.info('gameFinish.js winnerDeclareCall tableHistory Data => ', tableHistoryData);


    // let jobId1 = commandAcions.GetRandomString(10);
    // let delay1 = commandAcions.AddTime(5);
    // await commandAcions.setDelay(jobId1, new Date(delay1));

    if (gameStartStatus) {
      logger.info('winnerDeclareCall roundFinish ---->');

      commandAcions.sendEventInTable(tableInfo._id.toString(), CONST.RESTART_GAME_TABLE, { status: 0 });

      let roundTime = 10;
      let tableId = tableInfo._id;
      let fnsJobId = CONST.RESTART_GAME_TABLE + ':' + tableId;
      delay = commandAcions.AddTime(roundTime);

      await commandAcions.setDelay(fnsJobId, new Date(delay));
      // await roundEndActions.restartTable(tableInfo);

    } else {
      logger.info('winnerDeclareCall resetTable ---> ');
      await roundEndActions.resetTable(tableInfo);
    }
  } catch (err) {
    logger.error('gameFinish.js  WinnerDeclareCall => ', err);
  }
};

module.exports.waitingWinnerDeclareCall = async (tbInfo, seatIndex) => {
  const tb = tbInfo;
  try {
    let tbid = tb._id.toString();

    if (tb.isLastUserFinish) return false;
    if (tb.gameState === CONST.ROUND_END) return false;
    if (tb.isFinalWinner) return false;

    let updateData = {
      $set: {},
      $inc: {},
    };

    let amount = (tb.tableAmount * CONST.commission) / 100;
    tb.tableAmount -= amount;

    updateData.$set['isFinalWinner'] = true;
    updateData.$set['gameState'] = CONST.ROUND_END;
    updateData.$set['playerInfo.$.playerStatus'] = CONST.WON;
    updateData.$inc['playerInfo.$.chips'] = tb.tableAmount;
    updateData.$set['tableAmount'] = tb.tableAmount;

    const upWh = {
      _id: MongoID(tbid),
      'playerInfo.seatIndex': Number(seatIndex),
    };

    const tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
      new: true,
    });

    // let updetUserChips = await this.updateUserScore(tableInfo.playerInfo[seatIndex].playerId, tableInfo.tableAmount);
    // logger.info('last winner Declare after declare upate user chips =>', updetUserChips);

    const playerInGame = await getPlayingUserInRound(tableInfo.playerInfo);

    playerInGame.forEach((player) => {
      if (player.playerStatus !== CONST.WON) {
        player.playerStatus = CONST.LOST;
        player.playerLostChips = tableInfo.entryFee;
        //logger.info('last User Winner Declare Call lost counter');
        this.updateLostCounter(player.playerId);
      }
    });

    for (let i = 0; i < playerInGame.length; i++) {
      tableInfo.gameTracks.push({
        _id: playerInGame[i]._id,
        username: playerInGame[i].username,
        seatIndex: playerInGame[i].seatIndex,
        cards: playerInGame[i].cards,
        gCard: playerInGame[i].gCard,
        point: playerInGame[i].point,
        gameChips: playerInGame[i].gameChips,
        gameBet: tableInfo.entryFee,
        result: playerInGame[i].playerStatus === CONST.WON ? CONST.WON : CONST.LOST,
      });
    }

    const winnerTrack = await gameTrackActions.gamePlayTracks(tableInfo.gameTracks, tableInfo);

    for (let i = 0; i < tableInfo.gameTracks.length; i++) {
      if (tableInfo.gameTracks[i].playerStatus === CONST.WON) {
        await walletActions.addWallet(tableInfo.gameTracks[i]._id, Number(winnerTrack.winningAmount), 'Credit', 'Win', 'Game', tableInfo);
      }
    }

    const playersScoreBoard = await this.countPlayerScore(tableInfo);
    const winnerViewResponse = winnerViewResponseFilter(playersScoreBoard);
    logger.info('Invalid OR Waiting User Winner Declare Call winner ViewR esponse :: ', JSON.stringify(winnerViewResponse, null, 5));

    const gamePlayData = JSON.parse(JSON.stringify(tableInfo));
    const rest = omit(gamePlayData, ['_id']);

    //save table history
    const tableHistory = { ...rest, tableId: tableInfo._id };

    const tableHistoryData = await commonHelper.insert(TableHistory, tableHistory);
    logger.info('gameFinish.js tableHistory Data => ', tableHistoryData);

    await roundEndActions.resetTable(tableInfo);
  } catch (e) {
    logger.error('gameFinish.js lastUserWinnerDeclareCall error => ', e);
  }
};

module.exports.winnerViewResponseFilter = (playerDetail) => {
  try {
    let userInfo = [];
    let playerInfo = playerDetail;
    for (let i = 0; i < playerInfo.length; i++) {
      if (typeof playerInfo[i].playerId !== 'undefined') {
        userInfo.push({
          playerId: playerInfo[i].playerId,
          playerName: playerInfo[i].playerName,
          result: playerInfo[i].result,
          cards: playerInfo[i].cards,
          gCards: playerInfo[i].gCards,
          point: playerInfo[i].point,
          score: playerInfo[i].score,
          lostChips: playerInfo[i].lostChips,
          avatar: playerInfo[i].avatar,
          chips: playerInfo[i].chips,
          gameChips: playerInfo[i].gameChips,
        });
      }
    }
    return {
      userInfo: userInfo,
    };
  } catch (err) {
    logger.error('gameFinish.js winnerViewResponseFilter => ', err);
  }
};

module.exports.updateLostCounter = async (playerId) => {
  try {
    logger.info('Update Lost Counter -->', playerId);
    let data = await Users.findOneAndUpdate({ _id: MongoID(playerId) }, { $inc: { 'counters.gameLoss': 1 } });

    if (data) {
      logger.info(' Increment Total Lost Match Succesfully ');
      return true;
    } else {
      logger.info(' Increment Lost Not updated ');
      return false;
    }
  } catch (error) {
    logger.info('gameFinish.js updateLostCounter error => ', error);
  }
};

module.exports.updateUserScore = async (playerId, gameChips) => {
  try {
    logger.info('Deal update User Score payload =>', gameChips);
    logger.info('playerId payload =>', playerId);

    let data;
    if (gameChips > 0) {
      let bonusChips = Number((gameChips * 10) / 100);
      let finalGameChips = gameChips - bonusChips

      logger.info('Deal bonusChips  =>', bonusChips);
      logger.info('Deal finalGameChips', finalGameChips);

      data = await Users.findOneAndUpdate({ _id: MongoID(playerId) }, { $inc: { chips: finalGameChips, bonusChips: bonusChips } }, { new: true });
      logger.info('Update User Score =>', data);
    } else {
      data = await Users.findOneAndUpdate({ _id: MongoID(playerId) }, { $inc: { chips: gameChips } }, { new: true });
      logger.info('Update User Score =>', data);
    }

    if (data) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.info('gameFinish.js updateUserScore error => ', error);
  }
};

module.exports.manageUserScore = async (playerInfo, tabInfo) => {
  logger.info('table details manage user score => ', tabInfo);
  let tableInfo = tabInfo;

  for (let i = 0; i < playerInfo.length; i++) {
    if (playerInfo[i].playerStatus !== CONST.WON && playerInfo[i].playerStatus !== CONST.INVALID_DECLARE) {
      let pId = playerInfo[i].playerId;

      let updateData = {
        $set: {},
        $inc: {},
      };

      const upWh = {
        _id: MongoID(tabInfo._id),
        'playerInfo._id': MongoID(pId),
      };

      let playerScore = await getScore(playerInfo[i].gCard, tabInfo.wildCard);

      let lostChips;
      if (playerScore === 0) {
        lostChips = Number(2);
      } else {
        lostChips = Number(playerScore);
      }

      updateData.$set['playerInfo.$.finished'] = true;
      //updateData.$set['playerInfo.$.point'] = lostChips;
      updateData.$inc['playerInfo.$.gameChips'] = lostChips;
      updateData.$set['playerInfo.$.playerStatus'] = CONST.LOST;
      updateData.$set['playerInfo.$.currentGamePoint'] = lostChips;

      tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
      logger.info('1 table info manageUserScore =>', tableInfo);
    } else {
      logger.info('find won');
    }
  }
  logger.info('2 table info manageUserScore =>', tableInfo);

  return tableInfo;
};

module.exports.manageLastUserScore = async (playerInfo, tabInfo) => {
  let tableInfo;
  for (let i = 0; i < playerInfo.length; i++) {
    if (playerInfo[i].playerStatus !== CONST.WON) {
      let pId = playerInfo[i].playerId;

      let updateData = {
        $set: {},
        $inc: {},
      };

      const upWh = {
        _id: MongoID(tabInfo._id),
        'playerInfo._id': MongoID(pId),
      };

      updateData.$set['playerInfo.$.finished'] = true;
      updateData.$set['playerInfo.$.point'] = playerInfo[i].point;
      updateData.$inc['playerInfo.$.gameChips'] = playerInfo[i].gameChips;
      updateData.$set['playerInfo.$.playerStatus'] = CONST.LOST;

      tableInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
        new: true,
      });
    } else {
      logger.info('find won');
    }
  }

  return tableInfo;
};

module.exports.countPlayerScore = async (table) => {
  try {
    let finalplayersScoreBoard = [];
    const playerInGame = await getPlayingUserInRound(table.playerInfo);
    let alreadyCalculatedScorePlayersIds = table.playersScoreBoard.map(({ playerId }) => playerId);

    playerInGame.map((player) => {
      if (alreadyCalculatedScorePlayersIds.indexOf(player.playerId) < 0) {
        finalplayersScoreBoard.push({
          playerId: player._id,
          playerName: player.name,
          result: player.playerStatus,
          cards: player.cards,
          point: player.point,
          gameChips: player.gameChips,
          gCards: player.gCard,
          avatar: player.avatar,
        });
      }
    });
    // eslint-disable-next-line no-param-reassign
    table.playersScoreBoard = table.playersScoreBoard.concat(finalplayersScoreBoard);

    let wh = {
      _id: MongoID(table._id.toString()),
    };

    let updateData = {
      $set: {
        playersScoreBoard: table.playersScoreBoard,
      },
    };

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
      new: true,
    });

    return tbInfo.playersScoreBoard;
  } catch (error) {
    logger.error('cardFunction.js countPlayerScore error => ', error);
    return false;
  }
};

module.exports.updateExpeledPlayer = async (playerInfo, tableInfo) => {
  try {
    let tabInfo = tableInfo;
    for (let i = 0; i < playerInfo.length; i++) {
      if (playerInfo[i].gameChips >= tableInfo.gameType) {
        let pId = playerInfo[i].playerId;

        let updateData = {
          $set: {},
          $inc: {},
        };

        const upWh = {
          _id: MongoID(tableInfo._id),
          'playerInfo._id': MongoID(pId),
        };

        updateData.$set['playerInfo.$.detain'] = true;
        updateData.$set['playerInfo.$.playerStatus'] = CONST.EXPELED;

        tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, {
          new: true,
        });
      }
    }
    return tabInfo;
  } catch (error) {
    logger.info('gameFinish.js updateLostCounter error => ', error);
  }
};
