const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = mongoose.model('users');
const PlayingTables = mongoose.model("dicePlayingTables");
const BetLists = mongoose.model("dicebetLists")
const { sendEvent, sendDirectEvent, AddTime, setDelay, clearJob } = require('../../helper/socketFunctions');
const gameStartActions = require("./gameStart");
const CONST = require('../../constant');
const logger = require("../../logger");
const botLogic = require("./botLogic");


module.exports.joinTable = async (requestData, client) => {
    try {
        logger.info("Dice requestData-->", requestData);

        if (typeof client.uid == "undefined" || requestData.playerId == '' || requestData.playerId == null) {
            sendEvent(client, CONST.DICE_JOIN_TABLE, requestData, false, "Please restart game!!");
            return false;
        }
        if (typeof client.JT != "undefined" && client.JT) { return false };

        client.JT = true;

        let bwh = {
            maxSeat: requestData.maxSeat,
            boot: requestData.boot
        }
        const betInfo = await BetLists.findOne(bwh, {}).lean();
        logger.info("Dice Join Table data : ", JSON.stringify(betInfo));

        if (betInfo == null) {
            sendEvent(client, CONST.DICE_JOIN_TABLE, requestData, false, "Not Found Bet Details!!!");
            delete client.JT
            return false;
        }

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("JoinTable UserInfo : ", gwh, JSON.stringify(UserInfo));

        let totalWallet = Number(UserInfo.chips)
        if (Number(totalWallet) < Number(betInfo.boot)) {
            sendEvent(client, CONST.DICE_JOIN_TABLE, requestData, false, "Please add Wallet!!");
            delete client.JT
            return false;
        }

        let gwh1 = {
            "playerInfo._id": MongoID(client.uid)
        }
        let tableInfo = await PlayingTables.findOne(gwh1, {}).lean();
        logger.info("JoinTable tableInfo : ", gwh, JSON.stringify(tableInfo));

        if (tableInfo != null) {
            sendEvent(client, CONST.DICE_JOIN_TABLE, requestData, false, "Already In playing table!!");
            delete client.JT
            return false;
        }
        await this.findTable(betInfo, client)
    } catch (error) {
        logger.info("JOIN_TABLE", error);
    }
}

module.exports.findTable = async (betInfo, client) => {
    logger.info("findTable betInfo : ", JSON.stringify(betInfo));

    let tableInfo = await this.getBetTable(betInfo);
    logger.info("findTable tableInfo : ", JSON.stringify(tableInfo));

    if (tableInfo.gameTimer !== null && tableInfo.gameTimer !== undefined) {
        let currentDateTime = new Date();
        let time = currentDateTime.getSeconds();
        let turnTime = new Date(tableInfo.gameTimer.GST);
        let Gtime = turnTime.getSeconds();
        let diff = Gtime - time;

        if (Math.abs(diff) > 6 && Math.abs(diff) < 10) {
            let tbId = tableInfo._id;
            let jobId = 'WAITING:' + tbId;
            let delay = AddTime(6);

            await setDelay(jobId, new Date(delay));
            await this.findTable(betInfo, socket);
        } else {
            // logger.info('time is greater than 4 sec');
        }
    }

    await this.findEmptySeatAndUserSeat(tableInfo, betInfo, client);
}

module.exports.getBetTable = async (betInfo) => {
    logger.info("getBetTable betInfo : ", JSON.stringify(betInfo));
    let wh = {
        entryFee: Number(betInfo.entryFee),
        activePlayer: { $gte: 0, $lt: betInfo.maxSeat },
        maxSeat: parseInt(betInfo.maxSeat),
    }
    logger.info("getBetTable wh : ", JSON.stringify(wh));

    let tableInfo = await PlayingTables.find(wh, {}).sort({ activePlayer: 1 }).lean();
    logger.info("tableInfo getBetTable wh :=> ", JSON.stringify(tableInfo));

    if (tableInfo.length > 0) {
        return tableInfo[0];
    }
    let table = await this.createTable(betInfo);
    return table;
}

module.exports.createTable = async (betInfo) => {
    try {
        logger.info("Dice createTable betInfo : ", JSON.stringify(betInfo));

        let insertobj = {
            gameId: "",
            maxSeat: betInfo.maxSeat,
            gamePlayType: "Dice",
            activePlayer: 0,
            betId: betInfo._id,
            entryFee: betInfo.entryFee,
            playerInfo: this.makeObjects(Number(betInfo.maxSeat)),
            gameState: "",
            currentDiceNumber: 0,
            roundStart: false
        };
        logger.info("createTable insertobj : ", insertobj);

        let insertInfo = await PlayingTables.create(insertobj);
        logger.info("createTable insertInfo : ", insertInfo);

        return insertInfo;

    } catch (error) {
        logger.error('joinTable.js createTable error=> ', error, betInfo);

    }
}

module.exports.makeObjects = (no) => {
    logger.info("makeObjects no : ", no)
    const arr = new Array();
    for (i = 0; i < no; i++)
        arr.push({});
    return arr;
}

module.exports.findEmptySeatAndUserSeat = async (table, betInfo, client) => {
    try {
        logger.info("Dice findEmptySeatAndUserSeat table :=> ", table + '\n' + " betInfo :=> ", betInfo);
        let seatIndex = this.findEmptySeat(table.playerInfo); //finding empty seat
        logger.info("Dice findEmptySeatAndUserSeat seatIndex ::", seatIndex);

        if (seatIndex == "-1") {
            await this.findTable(betInfo, client)
            return false;
        }

        let user_wh = {
            _id: client.uid
        }

        let userInfo = await GameUser.findOne(user_wh, {}).lean();
        logger.info("findEmptySeatAndUserSeat userInfo : ", userInfo)

        // let wh = {
        //     _id : table._id.toString()
        // };
        // let tbInfo = await PlayingTables.findOne(wh,{}).lean();
        // logger.info("findEmptySeatAndUserSeat tbInfo : ", tbInfo)

        let totalWallet = Number(userInfo.chips) + Number(userInfo.winningChips)
        let playerDetails = {
            seatIndex: seatIndex,
            _id: userInfo._id,
            name: userInfo.name,
            playerId: userInfo._id,
            username: userInfo.username,
            profile: userInfo.profileUrl,
            coins: totalWallet,
            status: CONST.WAITING,
            playerStatus: "",
            dice: [],
            slectDice: false,
            selectedDiceNumber: 0,
            turnMissCounter: 0,
            cuurentDiceNumber: 0,
            turnCount: 0,
            sck: client.id,
            playerSocketId: client.id,
            playerLostChips: 0,
            winStatus: false,
            finished: false,
            isSee: false,
            isBot: userInfo.isBot != undefined ? userInfo.isBot : 0
        }

        logger.info("findEmptySeatAndUserSeat playerDetails : ", playerDetails);

        let whereCond = {
            _id: MongoID(table._id.toString())
        };
        whereCond['playerInfo.' + seatIndex + '.seatIndex'] = { $exists: false };

        let setPlayerInfo = {
            $set: {
            },
            $inc: {
                activePlayer: 1
            }
        };
        setPlayerInfo["$set"]["playerInfo." + seatIndex] = playerDetails;

        logger.info("findEmptySeatAndUserSeat whereCond : ", whereCond, setPlayerInfo);

        let tableInfo = await PlayingTables.findOneAndUpdate(whereCond, setPlayerInfo, { new: true });
        logger.info("\nfindEmptySeatAndUserSeat tbInfo : ", tableInfo);

        let playerInfo = tableInfo.playerInfo[seatIndex];

        if (!(playerInfo._id.toString() == userInfo._id.toString())) {
            await this.findTable(betInfo, client);
            return false;
        }
        client.seatIndex = seatIndex;
        client.tbid = tableInfo._id;

        logger.info('\n Assign table id and seat index socket event ->', client.seatIndex, client.tbid);
        let diff = -1;

        if (tableInfo.activePlayer >= 2 && tableInfo.gameState === CONST.ROUND_START_TIMER) {
            let currentDateTime = new Date();
            let time = currentDateTime.getSeconds();
            let turnTime = new Date(tableInfo.gameTimer.GST);
            let Gtime = turnTime.getSeconds();

            diff = Gtime - time;
            diff += CONST.gameStartTime;
        }

        sendEvent(client, CONST.D_JOIN_SIGN_UP, {});

        //GTI event
        sendEvent(client, CONST.DICE_GAME_TABLE_INFO, {
            ssi: tableInfo.playerInfo[seatIndex].seatIndex,
            gst: diff,
            pi: tableInfo.playerInfo,
            utt: CONST.userTurnTimer,
            fns: CONST.finishTimer,
            tableid: tableInfo._id,
            gamePlayType: tableInfo.gameType,
            type: tableInfo.gameType,
            openDecks: tableInfo.openDeck,
            tableAmount: tableInfo.tableAmount,
        });

        if (userInfo.isBot == undefined || userInfo.isBot == 0) {

            client.join(tableInfo._id.toString());
        }

        sendDirectEvent(client.tbid.toString(), CONST.DICE_JOIN_TABLE, {
            ap: tableInfo.activePlayer,
            playerDetail: tableInfo.playerInfo[seatIndex],
        });

        delete client.JT;

        if (tableInfo.activePlayer == 2 && tableInfo.gameState == "") {

            let jobId = "LEAVE_SINGLE_USER:" + tableInfo._id;
            clearJob(jobId)

            await gameStartActions.gameTimerStart(tableInfo);
        }
        if (tableInfo.activePlayer == 1) {
            setTimeout(() => {
                if (tableInfo.maxSeat === 2 && tableInfo.activePlayer < 2) {
                    setTimeout(() => {
                        botLogic.JoinRobot(tableInfo, betInfo)
                    }, 1000)
                }
            }, 7000)
        } else if (userInfo.isBot == true) {
            if (tableInfo.maxSeat === 2 && tableInfo.activePlayer < 2) {
                setTimeout(() => {
                    botLogic.JoinRobot(tableInfo, betInfo)
                }, 1000)
            }
        }
    } catch (error) {
        console.info("findEmptySeatAndUserSeat", error);
    }
}

module.exports.findEmptySeat = (playerInfo) => {
    for (x in playerInfo) {
        if (typeof playerInfo[x] == 'object' && playerInfo[x] != null && typeof playerInfo[x].seatIndex == 'undefined') {
            return parseInt(x);
            break;
        }
    }
    return '-1';
}