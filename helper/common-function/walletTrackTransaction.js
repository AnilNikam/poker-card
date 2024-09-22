const mongoose = require('mongoose');
const UserWalletTracks = require('../../models/userWalletTracks');
const UserReferTracks = require('../../models/userReferTracks');
const GameUser = require('../../models/users');
const CONST = require('../../constant');
const commandAcions = require('../socketFunctions');
const logger = require('../../logger');
const MongoID = mongoose.Types.ObjectId;

//withdrawableChips 
module.exports.deductWalletPayOut = async (id, deductChips, tType, t, tblInfo) => {
  let tbInfo = tblInfo;
  try {
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }

    let upReps = await GameUser.findOne(wh, {}).lean();

    if (upReps === null) {
      return false;
    }

    let setInfo = {
      $inc: {
        winningChips: deductChips
      },
    };

    logger.info('\n Dedudct* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Dedudct* Wallet deductChips :: ==>', deductChips);

    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Dedudct Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.winningChips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      let walletTrack = {
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: deductChips,
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction deductWallet Exception error => ', e);
    return 0;
  }
};

module.exports.addWallet = async (id, addCoins, tType, t, tabInfo) => {
  try {
    logger.info('\n add Wallet : call -->>>', id, addCoins, t);
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
    logger.info('Wh  =  ==  ==>', wh);

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }
    const addedCoins = Number(addCoins.toFixed(2));

    const userInfo = await GameUser.findOne(wh, {}).lean();
    logger.info('Add Wallet userInfo ::=> ', userInfo);
    if (userInfo === null) {
      return false;
    }

    let setInfo = {
      $inc: {
        winningChips: Number(tabInfo.tableAmount - tabInfo.entryFee),
        'counters.gameWin': 1,
      },
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins, '\n tabInfo.tableAmount :: ==>', tabInfo.tableAmount);
    const uWh = {
      _id: MongoID(tabInfo.playerInfo[tabInfo.currentPlayerTurnIndex]._id),
    };
    logger.info('\n AddWallet wh ::---> ', uWh);
    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Add Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.chips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      logger.info('\n AddWallet tType :: ', tType);

      let walletTrack = {
        // id: userInfo._id,
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: addedCoins,
        chips: userInfo.chips,
        winningChips: userInfo.winningChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: tabInfo && tabInfo.gameId ? tabInfo.gameId : '',
        gameType: tabInfo && tabInfo.gamePlayType ? tabInfo.gamePlayType : '', //Game Type
        maxSeat: tabInfo && tabInfo.maxSeat ? tabInfo.maxSeat : 0, //Maxumum Player.
        betValue: tabInfo && tabInfo.entryFee ? tabInfo.entryFee : 0,
        tableId: tabInfo && tabInfo._id ? tabInfo._id.toString() : '',
      };
      await this.trackUserWallet(walletTrack);
    }
    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

//Winning Chips 
module.exports.addWalletWinngChpis = async (id, addCoins, tType, t, tabInfo) => {
  try {
    logger.info('\n add Wallet : call -->>>', id, addCoins, t);
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
    logger.info('Wh  =  ==  ==>', wh);

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }
    const addedCoins = Number(addCoins.toFixed(2));

    const userInfo = await GameUser.findOne(wh, {}).lean();
    logger.info('Add Wallet userInfo ::=> ', userInfo);
    if (userInfo === null) {
      return false;
    }

    let setInfo = {
      $inc: {
        winningChips: addedCoins
      },
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Add Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.winningChips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      logger.info('\n AddWallet tType :: ', tType);

      let walletTrack = {
        // id: userInfo._id,
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: addedCoins,
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

//Depotit Chips 
module.exports.addWalletPayin = async (id, addCoins, tType, t, tabInfo) => {
  try {
    logger.info('\n add Wallet : call -->>>', id, addCoins, t);
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
    logger.info('Wh  =  ==  ==>', wh);

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }
    const addedCoins = Number(addCoins.toFixed(2));

    const userInfo = await GameUser.findOne(wh, {}).lean();
    logger.info('Add Wallet userInfo ::=> ', userInfo);
    if (userInfo === null) {
      return false;
    }

    let setInfo = {
      $inc: {
        chips: addedCoins
      },
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Add Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.chips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      logger.info('\n AddWallet tType :: ', tType);

      let walletTrack = {
        // id: userInfo._id,
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: addedCoins,
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

/*
  lock bonus check 
  > 500 

  addCoins > lock bonus == lock bonus 
  
  unlock ma add thasse 


*/
module.exports.locktounlockbonus = async (id, addCoins, tType, t, tabInfo) => {
  try {
    logger.info('\n add Wallet : call -->>>', id, addCoins, t);
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
    logger.info('Wh  =  ==  ==>', wh);

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }
    const addedCoins = Number(addCoins.toFixed(2));

    const userInfo = await GameUser.findOne(wh, {}).lean();
    logger.info('Add Wallet userInfo ::=> ', userInfo);
    if (userInfo === null) {
      return false;
    }
    logger.info('userInfo.lockbonusChips ', userInfo.lockbonusChips)

    if (userInfo.lockbonusChips < 500) {
      logger.info('return false ::::::::::::::::::::::::', userInfo.lockbonusChips)

      return false
    }
    addedCoins = (userInfo.lockbonusChips > addCoins) ? addCoins : userInfo.lockbonusChips;

    logger.info('addedCoins ::=> ', addedCoins)

    let setInfo = {
      $inc: {
        lockbonusChips: -addedCoins,
        bonusChips: addCoins
      }
    };

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Add Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.chips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      logger.info('\n AddWallet tType :: ', tType);

      let walletTrack = {
        // id: userInfo._id,
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: addedCoins,
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        // referralChips: tbl.referralChips, // referarl Chips
        // unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        // lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        // withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};

// //Sinup Bonus & Deposit Bonus 
// module.exports.addReffralBonusDeposit = async (id, addCoins, tType, t) => {
//   try {
//     logger.info('\n add addReffralBonusDeposit : call -->>>', id, addCoins, t);
//     const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
//     logger.info('Wh  =  ==  ==>', wh);

//     if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
//       return false;
//     }
//     const addedCoins = Number(addCoins.toFixed(2));

//     const whr = typeof id === 'string' ? { referalUserId: MongoID(id).toString(), reffralStatus: false } : { _id: id };
//     const UserReferTrackInfo = await UserReferTracks.findOne(whr, {}).lean();
//     if (UserReferTrackInfo) {
//       const userInfo = await GameUser.findOne(wh, {}).lean();
//       logger.info('Add addReffralBonusDeposit userInfo ::=> ', userInfo);

//       if (userInfo === null) {
//         return false;
//       }

//       let setInfo = {
//         $inc: {
//           referralChips: addedCoins
//         },
//       };

//       logger.info('\n Add* addReffralBonusDeposit setInfo :: ==>', setInfo);
//       logger.info('\n Add* addReffralBonusDeposit addedCoins :: ==>', addedCoins);

//       let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
//       logger.info('\n Add addReffralBonusDeposit up Reps :::: ', tbl);

//       let setInfos = {
//         $set: {
//           reffralStatus: true
//         },
//       };
//       let updatereffralSatus = await UserReferTracks.findOneAndUpdate(wh, setInfos, { new: true });
//       logger.info('\n Add addReffralBonusDeposit updatereffralSatus Reps :::: ', updatereffralSatus);

//       let totalRemaningAmount = Number(tbl.chips);
//       logger.info('\n Dedudct addReffralBonusDeposit total RemaningAmount :: ', Number(totalRemaningAmount));

//       if (typeof tType !== 'undefined') {
//         logger.info('\n AddWallet tType :: ', tType);

//         let walletTrack = {
//           // id: userInfo._id,
//           uniqueId: tbl.uniqueId,
//           userId: tbl._id,
//           transType: tType,
//           transTypeText: t,
//           transAmount: addedCoins,
//           chips: tbl.chips,
//           winningChips: tbl.winningChips,
//           bonusChips: tbl.bonusChips,
//           referralChips: tbl.referralChips, // referarl Chips
//           unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
//           lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
//           // withdrawableChips: tbl.withdrawableChips,
//           totalBucket: Number(totalRemaningAmount),
//           gameId: '',
//           gameType: '', //Game Type
//           maxSeat: 0, //Maxumum Player.
//           betValue: 0,
//           tableId: '',
//         };
//         await this.trackUserWallet(walletTrack);
//       }
//       console.log("tbl.sckId ", tbl.sckId)

//       commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

//       return totalRemaningAmount;
//     } else {
//       logger.info("reffral id or user not found")
//     }

//   } catch (e) {
//     logger.error('walletTrackTransaction.js addWallet error =>', e);
//     return 0;
//   }
// };

//Sinup Bonus & Deposit Bonus 
module.exports.addWalletBonusDeposit = async (id, addCoins, tType, t) => {
  try {
    logger.info('\n add Wallet : call -->>>', id, addCoins, t);
    const wh = typeof id === 'string' ? { _id: MongoID(id).toString() } : { _id: id };
    logger.info('Wh  =  ==  ==>', wh);

    if (typeof wh === 'undefined' || typeof wh._id === 'undefined' || wh._id === null || typeof tType === 'undefined') {
      return false;
    }
    const addedCoins = Number(addCoins.toFixed(2));

    const userInfo = await GameUser.findOne(wh, {}).lean();
    logger.info('Add Wallet userInfo ::=> ', userInfo);
    if (userInfo === null) {
      return false;
    }
    let setInfo = {

    }
    if (userInfo.bonusChips + userInfo.lockbonusChips + addedCoins >= 500) {
      setInfo = {
        $inc: {
          lockbonusChips: addedCoins
        }
      };
    } else {
      setInfo = {
        $inc: {
          bonusChips: addedCoins
        }
      };
    }

    logger.info('\n Add* Wallet setInfo :: ==>', setInfo);
    logger.info('\n Add* Wallet addedCoins :: ==>', addedCoins);

    let tbl = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info('\n Add Wallet up Reps :::: ', tbl);

    let totalRemaningAmount = Number(tbl.chips);
    logger.info('\n Dedudct Wallet total RemaningAmount :: ', Number(totalRemaningAmount));

    if (typeof tType !== 'undefined') {
      logger.info('\n AddWallet tType :: ', tType);

      let walletTrack = {
        // id: userInfo._id,
        uniqueId: tbl.uniqueId,
        userId: tbl._id,
        transType: tType,
        transTypeText: t,
        transAmount: addedCoins,
        chips: tbl.chips,
        winningChips: tbl.winningChips,
        bonusChips: tbl.bonusChips,
        lockbonusChips: tbl.lockbonusChips,

        //referralChips: tbl.referralChips, // referarl Chips
        //unlockreferralChips: tbl.unlockreferralChips, // referarl Chips unlock Chips  
        //lockreferralChips: tbl.lockreferralChips, // referarl Chips lock Chips 
        //withdrawableChips: tbl.withdrawableChips,
        totalBucket: Number(totalRemaningAmount),
        gameId: '',
        gameType: '', //Game Type
        maxSeat: 0, //Maxumum Player.
        betValue: 0,
        tableId: '',
      };
      await this.trackUserWallet(walletTrack);
    }
    // console.log("tbl.sckId ", tbl.sckId)

    commandAcions.sendDirectEvent(tbl.sckId, CONST.PLAYER_BALANCE, { chips: tbl.chips, addCoins: addCoins });

    return totalRemaningAmount;
  } catch (e) {
    logger.error('walletTrackTransaction.js addWallet error =>', e);
    return 0;
  }
};


module.exports.trackUserWallet = async (obj) => {
  try {
    logger.info('\ntrackUserWallet obj ::', obj);

    let insertInfo = await UserWalletTracks.create(obj);
    logger.info('createTable UserWalletTracks : ', insertInfo);
    return true;
  } catch (e) {
    logger.error('walletTrackTransaction.js trackUserWallet error=> ', e);
    return false;
  }
};

module.exports.getWalletDetails = async (obj, client) => {
  try {
    logger.info('\n get Wallet Details ::', obj);

    let wh = { _id: obj };

    let walletDetails = await GameUser.findOne(wh, {}).lean();
    logger.info('getWalletDetails walletDetails : ', walletDetails);

    //"wb":WinningsBalance ||    "db": DepositBalance ||tw: TotalWinningBalance
    let response;
    if (walletDetails !== null) {
      response = {
        db: Number(walletDetails.chips.toFixed(2)),
        wb: Number(walletDetails.winningChips.toFixed(2)),
        // wb: userCoinInfoData.winningAmount,
        tw: (walletDetails.chips.toFixed(2) + walletDetails.winningChips.toFixed(2)),
      };
      logger.info('get Wallet Details Response : ', response);
      commandAcions.sendDirectEvent(client.id, CONST.PLAYER_BALANCE, response);
    } else {
      logger.info('At walletTrackTransaction.js:182 getWalletDetails => ', JSON.stringify(obj));
      commandAcions.sendDirectEvent(client.id, CONST.PLAYER_BALANCE, {}, false, 'user data not found');
    }
    return response;
  } catch (e) {
    logger.error('walletTrackTransaction.js getWalletDetails error => ', e);
    return false;
  }
};


module.exports.getWalletDetailsNew = async (obj, client) => {
  try {
    logger.info('\n MYWALLET get Wallet Details ::', obj);

    let wh = { _id: obj };

    let walletDetails = await GameUser.findOne(wh, {}).lean();
    logger.info('MYWALLET getWalletDetails walletDetails : ', walletDetails);

    //"wb":WinningsBalance ||    "db": DepositBalance ||tw: TotalWinningBalance
    let response;
    console.log(" walletDetails.bonusChips ", walletDetails)
    //+ walletDetails.withdrawableChips //+ walletDetails.referralChips
    if (walletDetails !== null) {
      response = {
        tb: Number(Number(walletDetails.chips + walletDetails.winningChips + walletDetails.bonusChips).toFixed(2)),
        mb: Number(walletDetails.chips.toFixed(2)),
        sb_db: Number(walletDetails.bonusChips.toFixed(2)),
        wb: Number(walletDetails.winningChips.toFixed(2)),
        ulb: Number(walletDetails.lockbonusChips)
        //wc: (walletDetails.withdrawableChips.toFixed(2)),
      };
      logger.info('get MYWALLET Wallet Details Response : ', response);
      commandAcions.sendDirectEvent(client.id, CONST.MYWALLET, response);
    } else {
      logger.info('At MYWALLET walletTrackTransaction.js:182 getWalletDetails => ', JSON.stringify(obj));
      commandAcions.sendDirectEvent(client.id, CONST.MYWALLET, {}, false, 'user data not found');
    }
    return response;
  } catch (e) {
    logger.error('MYWALLET walletTrackTransaction.js getWalletDetails error => ', e);
    return false;
  }
};

module.exports.deductWallet = async (id, deductChips, tType, t, tbInfo, client, seatIndex) => {
  try {
    logger.info('\ndedudctWallet : call.-->>>', id, deductChips, t);
    const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };

    if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
      return 0;
    }

    deductChips = Number(deductChips.toFixed(2));
    let projection = {
      id: 1,
      username: 1,
      uniqueId: 1,
      chips: 1,
      winningChips: 1,
      sck: 1,
      flags: 1
    }

    const userInfo = await GameUser.findOne(wh, projection);
    logger.info("get dedudctWallet userInfo Details =>: ", userInfo);

    if (userInfo == null) {
      return false;
    }

    userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
    userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

    let opGameWinning = userInfo.winningChips;
    let opChips = userInfo.chips;


    logger.info("userInfo.chips =>", userInfo.chips)
    logger.info("userInfo.winningChips =>", userInfo.winningChips)

    let setInfo = {
      $inc: {}
    };

    let totalDeductChips = deductChips;

    if (userInfo.winningChips > 0 && deductChips < 0) {

      setInfo['$inc']['winningChips'] = (userInfo.winningChips + deductChips) >= 0 ? Number(deductChips) : Number(-userInfo.winningChips);
      setInfo['$inc']['winningChips'] = Number(setInfo['$inc']['winningChips'].toFixed(2))

      let winningChips = userInfo.winningChips;

      userInfo.winningChips = (userInfo.winningChips + deductChips) >= 0 ? (Number(userInfo.winningChips) + Number(deductChips)) : 0;
      userInfo.winningChips = Number(Number(userInfo.winningChips).toFixed(2));

      deductChips = (deductChips + userInfo.winningChips) >= 0 ? 0 : (Number(deductChips) + Number(winningChips));
      deductChips = Number(Number(deductChips).toFixed(2));
    }

    if (userInfo.chips > 0 && deductChips < 0) {

      setInfo['$inc']['chips'] = (userInfo.chips + deductChips) >= 0 ? Number(deductChips) : Number(-userInfo.chips);
      setInfo['$inc']['chips'] = Number(setInfo['$inc']['chips'].toFixed(2))

      let chips = userInfo.chips;

      userInfo.chips = (userInfo.chips + deductChips) >= 0 ? (Number(userInfo.chips) + Number(deductChips)) : 0;
      userInfo.chips = Number(Number(userInfo.chips).toFixed(2));

      deductChips = (deductChips + userInfo.chips) >= 0 ? 0 : (Number(deductChips) + Number(chips));
      deductChips = Number(Number(deductChips).toFixed(2));
    }

    logger.info("\ndedudctWallet setInfo :: --->", setInfo);
    let tranferAmount = totalDeductChips;
    logger.info("final dedudctWallet userInfo :: ==>", userInfo);

    if (Object.keys(setInfo["$inc"]).length > 0) {
      for (let key in setInfo["$inc"]) {
        setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
      }
    }
    if (Object.keys(setInfo["$inc"]).length == 0) {
      delete setInfo["$inc"];
    }

    logger.info("\ndedudctWallet wh :: ", wh, setInfo);
    let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info("\nafter deduct check dedudctWallet upReps :: ", upReps);

    upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
    upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
    let totalRemaningAmount = upReps.chips + upReps.winningChips;

    if (typeof tType != 'undefined') {

      let walletTrack = {
        id: userInfo.id,
        uniqueId: userInfo.uniqueId,
        userId: wh._id.toString(),
        trnxType: tType,
        trnxTypeTxt: t,
        trnxAmount: tranferAmount,
        oppChips: opChips,
        oppWinningChips: opGameWinning,
        chips: upReps.chips,
        winningChips: upReps.winningChips,
        totalBucket: totalRemaningAmount,
        depositId: (tbInfo && tbInfo.depositId) ? tbInfo.depositId : "",
        withdrawId: (tbInfo && tbInfo.withdrawId) ? tbInfo.withdrawId : "",
        gameId: (tbInfo && tbInfo.gameId) ? tbInfo.game_id : "",
        isRobot: (typeof userInfo.flags != "undefined" && userInfo.flags.isRobot) ? userInfo.flags.isRobot : 0,
        gameType: (tbInfo && tbInfo.gameType) ? tbInfo.gameType : "", //Game Type
        maxSeat: (tbInfo && tbInfo.maxSeat) ? tbInfo.maxSeat : 0,//Maxumum Player.
        betValue: (tbInfo && tbInfo.betValue) ? tbInfo.betValue : 0,
        tableId: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
      }
      await this.trackUserWallet(walletTrack);
    }

    if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

      let updateData = {
        $set: {}
      }
      updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

      updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

      if (Object.keys(updateData.$set).length > 0) {
        let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
        logger.info("\ndedudctWallet upRepss  :: ", upRepss);
      }
    }

    logger.info(" userInfo.sckId.toString() => ", userInfo.sckId)
    logger.info(" upReps userInfo.sckId => ", upReps.sckId)
    logger.info(" client userInfo.sckId => ", client)

    commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.WALLET_UPDATE, {
      winningChips: upReps.winningChips,
      chips: upReps.chips,
      totalWallet: totalRemaningAmount,
      msg: t,
      seatIndex: seatIndex
    });

    if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined" && typeof tbInfo.gt != "undefined" && tbInfo.gt == "Points Rummy") {
      if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
        for (let i = 0; i < tbInfo.pi.length; i++) {
          if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

            let uChips = Number(upReps.chips) + Number(upReps.winningChips)

            let tbWh = {
              _id: MongoID(tbInfo._id.toString()),
              "playerInfo._id": MongoID(wh._id.toString())
            }

            await AviatorTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

            commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.TABLE_USER_WALLET_UPDATE, {
              totalWallet: uChips,
              seatIndex: tbInfo.playerInfo[i].seatIndex
            });
            break;
          }
        }
      }
    }
    return totalRemaningAmount;
  } catch (e) {
    logger.info("deductWallet : 1 : Exception : 1", e)
    return 0
  }
}

module.exports.addWallet = async (id, added_chips, tType, t, tbInfo, client, seatIndex) => {
  try {
    logger.info('\ndedudctWallet : call.-->>>', id, added_chips, t);
    const wh = (typeof id == 'string') ? { _id: MongoID(id) } : { _id: id };
    if (typeof wh == 'undefined' || typeof wh._id == 'undefined' || wh._id == null || typeof tType == 'undefined') {
      return false;
    }
    added_chips = Number(added_chips).toFixed(2);
    let projection = {
      id: 1,
      user_name: 1,
      uniqueId: 1,
      chips: 1,
      winningChips: 1,
      sck_id: 1,
      flags: 1
    }

    const userInfo = await GameUser.findOne(wh, projection);
    logger.info("dedudctWallet userInfo : ", userInfo);
    if (userInfo == null) {
      return false;
    }
    logger.info("dedudctWallet userInfo :: ", userInfo);

    userInfo.chips = (typeof userInfo.chips == 'undefined' || isNaN(userInfo.chips)) ? 0 : Number(userInfo.chips);
    userInfo.winningChips = (typeof userInfo.winningChips == 'undefined' || isNaN(userInfo.winningChips)) ? 0 : Number(userInfo.winningChips);

    let opGameWinning = userInfo.winningChips;
    let opChips = userInfo.chips;


    let setInfo = {
      $inc: {}
    };
    let totalDeductChips = added_chips;

    setInfo['$inc']['winningChips'] = Number(Number(added_chips).toFixed(2));

    userInfo.winningChips = Number(userInfo.winningChips) + Number(added_chips);
    userInfo.winningChips = Number(userInfo.winningChips.toFixed(2))


    logger.info("\ndedudctWallet setInfo :: ", setInfo);
    let tranferAmount = totalDeductChips;
    logger.info("dedudctWallet userInfo :: ", userInfo);

    if (Object.keys(setInfo["$inc"]).length > 0) {
      for (let key in setInfo["$inc"]) {
        setInfo["$inc"][key] = parseFloat(setInfo["$inc"][key].toString());
      }
    }
    if (Object.keys(setInfo["$inc"]).length == 0) {
      delete setInfo["$inc"];
    }

    logger.info("\ndedudctWallet wh :: ", wh, setInfo);
    let upReps = await GameUser.findOneAndUpdate(wh, setInfo, { new: true });
    logger.info("\ndedudctWallet upReps :: ", upReps);

    upReps.chips = (typeof upReps.chips == 'undefined' || isNaN(upReps.chips)) ? 0 : Number(upReps.chips);
    upReps.winningChips = (typeof upReps.winningChips == 'undefined' || isNaN(upReps.winningChips)) ? 0 : Number(upReps.winningChips);
    let totalRemaningAmount = upReps.chips + upReps.winningChips;

    if (typeof tType != 'undefined') {

      let walletTrack = {
        id: userInfo.id,
        uniqueId: userInfo.uniqueId,
        user_id: wh._id.toString(),
        trnx_type: tType,
        trnx_type_txt: t,
        trnx_amount: tranferAmount,
        opChips: opChips,
        opGameWinning: opGameWinning,
        chips: upReps.chips,
        winningChips: upReps.winningChips,
        total_bucket: totalRemaningAmount,
        deposit_id: (tbInfo && tbInfo.diposit_id) ? tbInfo.diposit_id : "",
        withdraw_id: (tbInfo && tbInfo.withdraw_id) ? tbInfo.withdraw_id : "",
        game_id: (tbInfo && tbInfo.game_id) ? tbInfo.game_id : "",
        is_robot: (typeof userInfo.flags != "undefined" && userInfo.flags.is_robot) ? userInfo.flags.is_robot : 0,
        game_type: (tbInfo && tbInfo.game_type) ? tbInfo.game_type : "", //Game Type
        max_seat: (tbInfo && tbInfo.max_seat) ? tbInfo.max_seat : 0,//Maxumum Player.
        bet: (tbInfo && tbInfo.bet) ? tbInfo.bet : 0,
        table_id: (tbInfo && tbInfo._id) ? tbInfo._id.toString() : ""
      }
      await this.trackUserWallet(walletTrack);
    }

    if ((typeof upReps.chips.toString().split(".")[1] != "undefined" && upReps.chips.toString().split(".")[1].length > 2) || (typeof upReps.winningChips.toString().split(".")[1] != "undefined" && upReps.winningChips.toString().split(".")[1].length > 2)) {

      let updateData = {
        $set: {}
      }
      updateData["$set"]["chips"] = parseFloat(upReps.chips.toFixed(2))

      updateData["$set"]["winningChips"] = parseFloat(upReps.winningChips.toFixed(2))

      if (Object.keys(updateData.$set).length > 0) {
        let upRepss = await GameUser.findOneAndUpdate(wh, updateData, { new: true });
        logger.info("\ndedudctWallet upRepss  :: ", upRepss);
      }
    }
    commandAcions.sendDirectEvent(client, CONST.WALLET_UPDATE, {
      winningChips: upReps.winningChips,
      chips: upReps.chips,
      totalWallet: totalRemaningAmount,
      msg: t,
      seatIndex: seatIndex
    });

    if (typeof tbInfo != "undefined" && tbInfo != null && typeof tbInfo._id != "undefined") {
      if (typeof tbInfo.pi != "undefined" && tbInfo.pi.length > 0) {
        for (let i = 0; i < tbInfo.pi.length; i++) {
          if (typeof tbInfo.pi[i] != "undefined" && typeof tbInfo.pi[i].ui != "undefined" && tbInfo.pi[i].ui._id.toString() == wh._id.toString()) {

            let uChips = Number(upReps.chips) + Number(upReps.winningChips)

            let tbWh = {
              _id: MongoID(tbInfo._id.toString()),
              "playerInfo._id": MongoID(wh._id.toString())
            }
            await AviatorTables.findOneAndUpdate(tbWh, { $set: { "playerInfo.$.coins": uChips } }, { new: true })

            commandAcions.sendEventInTable(client, CONST.TABLE_USER_WALLET_UPDATE, {
              totalWallet: uChips,
              seatIndex: tbInfo.playerInfo[i].seatIndex
            });
            break;
          }
        }
      }
    }
    return totalRemaningAmount;
  } catch (e) {
    logger.info("deductWallet : 1 : Exception : 1", e)
    return 0
  }
}
