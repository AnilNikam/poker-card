const mongoose = require('mongoose');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model('dicePlayingTables');
const Users = mongoose.model('users');

const CONST = require('../../constant');
const logger = require('../../logger');
const gamePlayActions = require('./gamePlay');
const commandAcions = require('../../helper/socketFunctions');

const { slectDice, getDiceNumber } = require('./botLogic');
const { lastUserWinnerDeclareCall } = require('./gameFinish');
const { createDealer } = require('../../helper/helperFunction');


module.exports.roundStarted = async (tbl) => {
  try {
    logger.info('roundStarted call tbid ');
    let tb = tbl;
    const whr = {
      _id: MongoID(tb._id.toString()),
    };
    let dealerSeatIndex = createDealer(tb.activePlayer - 1);

    const update1 = {
      $set: {
        currentPlayerTurnIndex: dealerSeatIndex,
      },
    };

    const tbInfo = await PlayingTables.findOneAndUpdate(whr, update1, { new: true });
    logger.info('roundStarted tabInfo : ', tbInfo);

    const wh = {
      _id: MongoID(tbInfo._id),
    };
    const project = {
      gameState: 1,
      playerInfo: 1,
      activePlayer: 1,
      currentPlayerTurnIndex: 1,
    };
    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    logger.info('roundStarted tabInfo : ', tabInfo);

    if (tabInfo == null) {
      logger.info('roundStarted table in 1:', tabInfo);
      return false;
    }

    if (tabInfo.gameState != 'SelectDiceNumber' || tabInfo.activePlayer < 2) {
      logger.info('roundStarted table in 2:', tabInfo.gameState, tabInfo.activePlayer);
      return false;
    }

    let roundTime = 5;
    commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.DICE_ROUND_START, { timer: roundTime });

    let tbId = tabInfo._id;
    let jobId = CONST.DICE_ROUND_START + ':' + tbId;
    let delay = commandAcions.AddTime(roundTime);

    await commandAcions.setDelay(jobId, new Date(delay));

    // for (let i = 0; i < tabInfo.playerInfo.length; i++)
    //   if (typeof tabInfo.playerInfo[i].seatIndex != 'undefined') {
    //     tabInfo.playerInfo[i].status = 'play';
    //     tabInfo.playerInfo[i].slectDice = false;
    //     let uWh = { _id: MongoID(tbid.toString()), 'playerInfo.seatIndex': Number(tabInfo.playerInfo[i].seatIndex) };
    //     logger.info('update slectDice UserState uWh update ::', uWh, update);
    //     let res = await PlayingTables.findOneAndUpdate(uWh, update, { new: true });
    //     logger.info('slectDice res ::', res);
    //   }

    const update = {
      $set: {
        gameState: CONST.ROUND_STARTED, //"RoundStated"
      },
    };
    logger.info('roundStarted update : ', wh, update);

    const tbal = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    logger.info('roundStarted tb : ', tbal);

    // await this.setFirstTurn(tb);
    await this.nextUserTurnstart(tbal);
  } catch (error) {
    logger.error('roundStart.js roundStarted error : ', error);
  }
};

module.exports.selectDiceRoundStarted = async (tbid) => {
  try {
    logger.info('roundStarted call tbid : ', tbid);
    const wh = {
      _id: MongoID(tbid),
    };
    const project = {
      gameState: 1,
      playerInfo: 1,
      activePlayer: 1,
      currentPlayerTurnIndex: 1,
    };
    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    logger.info('roundStarted tabInfo : ', tabInfo);

    if (tabInfo == null) {
      logger.info('roundStarted table in 1:', tabInfo);
      return false;
    }

    if (tabInfo.gameState != 'SelectDiceNumber' || tabInfo.activePlayer < 2) {
      logger.info('roundStarted table in 2:', tabInfo.gameState, tabInfo.activePlayer);
      return false;
    }

    // const update = {
    //     $set: {
    //         gameState: CONST.ROUND_STARTED, //"RoundStated"
    //     },
    // };
    // logger.info('roundStarted update : ', wh, update);

    // const tb = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    // logger.info('roundStarted tb : ', tb);

    // await this.setFirstTurn(tb);
    await this.nextUserTurnstart(tabInfo);
  } catch (error) {
    logger.error('roundStart.js roundStarted error : ', error);
  }
};

module.exports.selectDiceNumber = async (tbid) => {
  try {
    logger.info('roundStarted call tbid : ', tbid);
    const wh = {
      _id: MongoID(tbid),
    };
    const project = {
      gameState: 1,
      playerInfo: 1,
      activePlayer: 1,
      currentPlayerTurnIndex: 1,
    };
    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    logger.info('roundStarted tabInfo : ', tabInfo);

    if (tabInfo == null) {
      logger.info('roundStarted table in 1:', tabInfo);
      return false;
    }

    if (tabInfo.gameState != 'CardDealing' || tabInfo.activePlayer < 2) {
      logger.info('roundStarted table in 2:', tabInfo.gameState, tabInfo.activePlayer);
      return false;
    }

    // const update = {
    //   $set: {
    //     gameState: CONST.ROUND_STARTED, //"RoundStated"
    //   },
    // };
    // logger.info('roundStarted update : ', wh, update);

    // const tb = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    // logger.info('roundStarted tb : ', tb);

    // await this.setFirstTurn(tb);
    await this.nextUserTurnstart(tabInfo);
  } catch (error) {
    logger.error('roundStart.js roundStarted error : ', error);
  }
};

module.exports.setFirstTurn = async (tb) => {
  logger.info('setFirstTurn tb :', tb);
  await this.startUserTurn(tb.dealerSeatIndex, tb, true);
};

module.exports.nextUserTurnstart = async (tb) => {
  try {
    logger.info('nextUserTurnstart tb :: ', tb);
    let nextTurnIndex = await this.getUserTurnSeatIndex(tb, tb.currentPlayerTurnIndex, 0);
    logger.info('nextUserTurnstart nextTurnIndex :: ', nextTurnIndex);
    await this.startUserTurn(nextTurnIndex, tb, false);
  } catch (error) {
    logger.error('roundStart.js nextUserTurnstart error : ', error);
  }
};

module.exports.startUserTurn = async (seatIndex, objData, firstTurnStart) => {
  try {
    // logger.info("startUserTurn turnIndex :", seatIndex);
    // let jobid = CONST.TURN_START + ":" + objData._id.toString();

    let wh = {
      _id: objData._id.toString(),
    };
    let project = {
      jobId: 1,
    };

    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    logger.info('initGameState tabInfo : ', tabInfo);

    if (tabInfo === null) {
      logger.info('startUserTurn table in :', tabInfo);
      return false;
    }

    if (typeof tabInfo.jobId != 'undefined' && tabInfo.jobId != '') {
      let clearRes = await commandAcions.clearJob(tabInfo.jobId);
      logger.info('startUserTurn jobid :', clearRes);
    }

    let jobId = commandAcions.GetRandomString(10);
    let update = {
      $set: {
        turnSeatIndex: seatIndex,
        currentPlayerTurnIndex: seatIndex,
        turnDone: false,
        'gameTimer.ttimer': new Date(),
        jobId: jobId,
      },
    };
    logger.info('startUserTurn wh update ::', wh, update);

    let tb = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    logger.info('startUserTurn tb : ', tb);

    const playerInGame = await this.getPlayingUserInRound(tb.playerInfo);
    logger.info('startUserTurn playerInGame ::', playerInGame);
    logger.info('startUserTurn playerInGame length::', playerInGame.length);

    if (playerInGame.length == 1) {
      await lastUserWinnerDeclareCall(tb);

      logger.info('startUserTurn single user in game so game goes on winner state..!');
      return false;
    }

    let status = false;
    for (let e of tb.playerInfo) {
      if (e.slectDice === true) {
        status = true;

        let wher = {
          _id: objData._id.toString(),
        };
        let update1 = {
          $set: {
            roundStart: true,
          },
        };
        tb = await PlayingTables.findOneAndUpdate(wher, update1, { new: true });
        logger.info('check roundStart ', tb);

      } else {
        status = false;
      }
    }

    if (tb.roundStart && tb.gameState !== 'RoundStated') {
      logger.info('heck cll -->');
      this.roundStarted(tb);
      // return
    }

    let response = {
      si: tb.currentPlayerTurnIndex,
      pi: tb.playerInfo[tb.currentPlayerTurnIndex]._id,
      playerName: tb.playerInfo[tb.currentPlayerTurnIndex].name,

      previousTurn: objData.turnSeatIndex,
      nextTurn: tb.turnSeatIndex,
      numberSaved: tb.playerInfo[tb.currentPlayerTurnIndex].slectDice,
      // chalValue: chalvalue,
      // isShow: isShow
    };

    commandAcions.sendEventInTable(tb._id.toString(), CONST.DICE_USER_TURN_START, response);

    // if (tb.playerInfo != undefined && tb.playerInfo[tb.turnSeatIndex] != undefined && tb.playerInfo[tb.turnSeatIndex].isBot) {
    //   // Rboot Logic Start Playing
    //   slectDice(tb, tb.playerInfo[tb.turnSeatIndex], playerInGame)
    // }

    //Assign to bot
    let plid = tb.playerInfo[tb.currentPlayerTurnIndex]._id
    let plSeatIndex = tb.playerInfo[tb.currentPlayerTurnIndex].seatIndex

    const datas = await Users.findOne({
      _id: MongoID(plid),
    }).lean();

    logger.info("\n check data =>", datas)
    logger.info("\n tb.gameState =>", tb.gameState)

    if (datas && datas.isBot && tb.gameState === CONST.SELECT_DICE) {
      await slectDice(tb, { plid, plSeatIndex })
      // await easyPic(tb, plid, tb.gamePlayType, 'close')
    } else if (datas && datas.isBot && tb.gameState === CONST.ROUND_STARTED) {
      await getDiceNumber(tb, { plid, plSeatIndex })

    }


    let tbid = tb._id.toString();
    let time = 30;
    let turnChangeDelayTimer = commandAcions.AddTime(time);

    const delayRes = await commandAcions.setDelay(jobId, new Date(turnChangeDelayTimer));
    logger.info('startUserTurn delayRes : ', delayRes);

    await this.userTurnExpaire(tbid);
  } catch (error) {
    logger.error('roundStart.js startUserTurn error : ', error);
  }
};

module.exports.userTurnExpaire = async (tbid) => {
  try {
    logger.info('\nuserTurnExpaire tbid : ', tbid);
    const wh = {
      _id: MongoID(tbid),
    };
    let project = {
      gameState: 1,
      playerInfo: 1,
      activePlayer: 1,
      turnSeatIndex: 1,
      turnDone: 1,
      currentPlayerTurnIndex: 1,
    };
    let tabInfo = await PlayingTables.findOne(wh, project).lean();
    logger.info('userTurnExpaire tabInfo : ', tabInfo);

    if (tabInfo == null || tabInfo.gameState != 'RoundStated') return false;

    let activePlayerInRound = await this.getPlayingUserInRound(tabInfo.playerInfo);

    if (activePlayerInRound.length == 0 || tabInfo.turnDone) {
      logger.info('userTurnExpaire : user not activate found!!', activePlayerInRound, tabInfo.turnDone);
      return false;
    }
    // logger.info("\nmanagePlayerOnLeave activePlayerInRound :",activePlayerInRound, activePlayerInRound.length,tabInfo.gameState);

    let playerInfo = tabInfo.playerInfo[tabInfo.turnSeatIndex];
    logger.info('userTurnExpaire playerInfo :: ', playerInfo);

    const whPlayer = {
      _id: MongoID(tbid),
      'playerInfo.seatIndex': Number(tabInfo.turnSeatIndex),
    };
    let update = {
      $set: {
        turnDone: true,
      },
      $inc: {
        'playerInfo.$.turnMissCounter': 1,
      },
    };
    logger.info('userTurnExpaire whPlayer update :: ', whPlayer, update);

    const upRes = await PlayingTables.findOneAndUpdate(whPlayer, update, { new: true });
    logger.info('userTurnExpaire upRes : ', upRes);

    // const userDrop = await this.handleTimeOut(tabInfo.turnSeatIndex, tabInfo);
    // logger.info('userTurnExpaire userDrop : ', userDrop);

    return await this.nextUserTurnstart(upRes);

    /*
    if (userDrop) {
      const wh1 = {
        _id: MongoID(tabInfo._id.toString()),
      };
      const project1 = {
        gameState: 1,
        playerInfo: 1,
      };
      let taabInfo = await PlayingTables.findOne(wh1, project1).lean();
      logger.info('userTurnExpaire taabInfo : ', taabInfo);

      if (taabInfo == null) {
        logger.info('table not found::', taabInfo);
        return false;
      }

      const playerInGame = await this.getPlayingUserInRound(taabInfo.playerInfo);
      logger.info('userTurnExpaire playerInGame ::', playerInGame);

               // After winner then can't call next turn start function
      

      if (playerInGame.length > 1 && taabInfo.gameState == 'RoundStarted') {
        return await this.nextUserTurnstart(taabInfo);
      } else {
        logger.info('startUserTurn single user in game so game goes on winner state..!', taabInfo.gameState, playerInGame);
        return false;
      }
    } else {
      return await this.nextUserTurnstart(tabInfo);
    }
    */
  } catch (error) {
    logger.error('roundStart.js getUserTurnSeatIndex error : ', error);
  }
};

module.exports.handleTimeOut = async (turnIndex, tb) => {
  try {
    let playerInfo = tb.playerInfo[turnIndex];
    logger.info('handleTimeOut tb.pi[turnIndex] :: ', playerInfo);

    let requestData = {
      cards: playerInfo.cards,
      timeOut: true,
      reason: 'timeOutPack',
    };
    logger.info('handleTimeOut requestData ::', requestData);

    await gamePlayActions.cardPack(requestData, { tbid: tb._id, uid: playerInfo._id, seatIndex: playerInfo.seatIndex, sck: playerInfo.sck });
    return true;
  } catch (error) { }
};

module.exports.getPlayingUserInRound = async (p) => {
  try {
    let pl = [];
    if (typeof p == 'undefined' || p == null) return pl;

    for (let x = 0; x < p.length; x++) {
      if (typeof p[x] == 'object' && p[x] != null && typeof p[x].seatIndex != 'undefined' && p[x].status == 'play') pl.push(p[x]);
    }
    return pl;
  } catch (error) {
    logger.error('roundStart.js getPlayingUserInRound error : ', error);
  }
};

module.exports.getUserTurnSeatIndex = async (tbInfo, prevTurn, cnt) => {
  try {
    let counter = cnt;
    let p = tbInfo.playerInfo;
    let plen = p.length;

    let x = 0;

    if (prevTurn === plen - 1) x = 0;
    else x = Number(prevTurn) + 1;

    if (counter === plen + 1) {
      return prevTurn;
    }

    counter++;

    if (x < plen && (p[x] == null || typeof p[x].seatIndex == 'undefined' || p[x].status != 'play')) {
      let index = await this.getUserTurnSeatIndex(tbInfo, x, counter);
      return index;
    } else {
      logger.info('teen getUserTurnSeatIndex x', x);
      return x;
    }
  } catch (error) {
    logger.error('roundStart.js getUserTurnSeatIndex error : ', error);
  }
};

module.exports.checkShileShowSeatIndex = (seatIndex, p) => {
  let pl = [];
  let pr_seatIndex = seatIndex - 1 == -1 ? 4 : seatIndex - 1;
  if (typeof p[pr_seatIndex].pla) return pl;
};

module.exports.checShowButton = async (p, playerIndex) => {
  try {
    //&&  (p[i].playerStatus == "chal" || (p[i].playerStatus == "blind" &&
    let counter = 0;

    for (let i = 0; i < p.length; i++) {
      logger.info('checShowButton  :seatIndex  ', p[i].seatIndex);
      logger.info('checShowButton  :p[i].isSee  ', p[i].isSee);
      if (p[i].seatIndex != 'undefined' && playerIndex == p[i].seatIndex && p[i].isSee == true) {
        counter++;
      }
    }

    if (counter >= 1) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    logger.error('roundStart.js checShowButton error : ', error);
  }
};
