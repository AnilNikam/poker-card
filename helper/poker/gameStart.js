const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GameUser = require('../../models/users');
const PlayingTables = require("../../models/playingTables");
const IdCounter = require("../../models/idCounter")

const commandAcions = require("../socketFunctions");
const CONST = require("../../constant");
const logger = require("../../logger");
const cardDealActions = require("./cardDeal");
const roundStartActions = require("./roundStart");
const walletActions = require("./updateWallet");

// const leaveTableActions = require("./leaveTable");

module.exports.gameTimerStart = async (tb) => {
    try {
        logger.info("gameTimerStart tb : ", tb);
        if (tb.gameState != "") return false;

        let wh = {
            _id: tb._id
        }
        let update = {
            $set: {
                gameState: "GameStartTimer",
                "GameTimer.GST": new Date(),
                round: 1
            }
        }
        logger.info("gameTimerStart UserInfo : ", wh, update);

        const tabInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
        logger.info("gameTimerStart tabInfo :: ", tabInfo);

        let roundTime = 5;
        commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.GAME_START_TIMER, { timer: roundTime });

        let tbId = tabInfo._id;
        let jobId = CONST.GAME_START_TIMER + ":" + tbId;
        let delay = commandAcions.AddTime(roundTime);

        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        this.collectBoot(tbId)
    } catch (error) {
        logger.error("gameTimerStart.js error ->", error)
    }
}

module.exports.collectBoot = async (tbId) => {
    try {

        logger.info("collectBoot tbId : ", tbId);
        let wh = {
            _id: tbId
        };
        let tb = await PlayingTables.findOne(wh, {}).lean();
        logger.info("collectBoot tb : ", tb);

        let playerInfo = await this.resetUserData(tb._id, tb.playerInfo);
        logger.info("collectBoot playerInfo : ", playerInfo, tb.maxSeat);

        let finalPlayerInfo = await this.checkUserInRound(playerInfo, tb);
        logger.info("collectBoot finalPlayerInfo : ", finalPlayerInfo);

        if (finalPlayerInfo.length < 2) {
            return false;
        }
        let gameId = await this.getCount("gameId");

        // Dealer 

        // dealerSeatIndex: { type: Number, default: -1 },
        // smallblindSeatIndex: { type: Number, default: -1 },
        // bigblindSeatIndex: { type: Number, default: -1 },

        logger.info(" tb :::::::::::dealerSeatIndex ", tb.dealerSeatIndex);



        let dealerSeatIndex = await roundStartActions.getUserTurnSeatIndex(tb, tb.dealerSeatIndex, 0);
        let smallblindSeatIndex = await roundStartActions.getUserTurnSeatIndex(tb, dealerSeatIndex, 0);
        let bigblindSeatIndex = await roundStartActions.getUserTurnSeatIndex(tb, smallblindSeatIndex, 0);


        logger.info("dealerSeatIndex ", dealerSeatIndex);
        logger.info("smallblindSeatIndex ", smallblindSeatIndex);
        logger.info("bigblindSeatIndex ", bigblindSeatIndex);


        // Big Blind

        // Small Blind

        let update = {
            $set: {
                gameState: "CollectBoot",
                gameId: gameId.toString(),
                dealerSeatIndex: dealerSeatIndex,
                smallblindSeatIndex: smallblindSeatIndex,
                bigblindSeatIndex: bigblindSeatIndex,
                chalValue: Number(tb.boot)
            }
        }
        logger.info("collectBootvalue update : ", gameId, update);
        let tbInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });

        let seatIndexs = await this.deduct(tbInfo, finalPlayerInfo);

        let response = {
            bet: tbInfo.boot,
            seatIndexs: seatIndexs,
            gameId: gameId
        }
        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.COLLECT_BOOT, response);

        let tbid = tbInfo._id;
        let jobId = commandAcions.GetRandomString(10);
        let delay = commandAcions.AddTime(3);
        const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

        await cardDealActions.cardDealStart(tbid)
    } catch (error) {
        logger.error("collectBoot error ->", error)
    }
}

module.exports.deduct = async (tabInfo, playerInfo) => {
    try {
        logger.info("\ndeduct tabInfo :: ", tabInfo);

        logger.info("\ndeduct playerInfo :: ", playerInfo);
        let seatIndexs = [];
        for (let i = 0; i < playerInfo.length; i++) {
            if (playerInfo[i] != {} && typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play") {
                seatIndexs.push(playerInfo[i].seatIndex);

                if (tabInfo.bigblindSeatIndex == playerInfo[i].seatIndex) {

                    let update = {
                        $inc: {
                            "playerInfo.$.bet": Number(tabInfo.bigblind)
                        }
                    }
                    let uWh = { _id: MongoID(tabInfo._id.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                    logger.info("deduct uWh update ::", uWh, update)
                    await PlayingTables.findOneAndUpdate(uWh, update, { new: true });

                    await walletActions.deductWallet(playerInfo[i]._id, -Number(tabInfo.bigblind), 1, "Poker Bet", tabInfo, playerInfo[i].sck, playerInfo[i].seatIndex);

                }

                if (tabInfo.smallblindSeatIndex == playerInfo[i].seatIndex) {

                    let update = {
                        $inc: {
                            "playerInfo.$.bet": Number(tabInfo.smallblind)
                        }
                    }
                    let uWh = { _id: MongoID(tabInfo._id.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                    logger.info("deduct uWh update ::", uWh, update)
                    await PlayingTables.findOneAndUpdate(uWh, update, { new: true });

                    await walletActions.deductWallet(playerInfo[i]._id, -Number(tabInfo.smallblind), 1, "Poker Bet", tabInfo, playerInfo[i].sck, playerInfo[i].seatIndex);

                }
            }
        }
        return seatIndexs
    } catch (error) {
        logger.error("deduct error ->", error)
    }
}

module.exports.resetUserData = async (tbId, playerInfo) => {
    try {

        for (let i = 0; i < playerInfo.length; i++)
            if (typeof playerInfo[i].seatIndex != "undefined") {
                let update = {
                    $set: {
                        "playerInfo.$.status": "play",
                        "playerInfo.$.playStatus": "blind",
                        "playerInfo.$.chalValue": 0,
                        "playerInfo.$.cards": [],
                        "playerInfo.$.turnMissCounter": 0,
                        "playerInfo.$.turnDone": false,
                        "playerInfo.$.turnCount": 0,
                    }
                }
                playerInfo[i].status = "play";
                let uWh = { _id: MongoID(tbId.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("updateUserState uWh update ::", uWh, update)
                await PlayingTables.findOneAndUpdate(uWh, update, { new: true });
            }

        logger.info("updateUserState playerInfo::", playerInfo, playerInfo.length);
        let playerInfos = await roundStartActions.getPlayingUserInRound(playerInfo);
        logger.info("updateUserState playerInfos::", playerInfos)
        return playerInfos;
    } catch (error) {
        logger.error("resetUserData error ->", error)
    }
}

module.exports.checkUserInRound = async (playerInfo, tb) => {
    try {

        let userIds = [];
        let userSeatIndexs = {};
        for (let i = 0; i < playerInfo.length; i++) {
            userIds.push(playerInfo[i]._id);
            userSeatIndexs[playerInfo[i]._id.toString()] = playerInfo[i].seatIndex;
        }
        logger.info("checkUserState userIds ::", userIds, userSeatIndexs);
        let wh = {
            _id: {
                $in: userIds
            }
        }
        let project = {
            chips: 1,
            winningChips: 1,
            sck: 1,
        }
        let userInfos = await GameUser.find(wh, project);
        logger.info("checkUserState userInfos :: ", userInfos);

        let userInfo = {};

        for (let i = 0; i < userInfos.length; i++)
            if (typeof userInfos[i]._id != "undefined") {
                let totalWallet = Number(userInfos[i].chips) + Number(userInfos[i].winningChips)
                userInfo[userInfos[i]._id] = {
                    coins: totalWallet,
                }
            }

        for (let i = 0; i < userInfos.length; i++)
            if (typeof userInfos[i]._id != "undefined") {
                if (Number(userInfo[userInfos[i]._id.toString()].coins) < (Number(tb.boot))) {
                    await leaveTableActions.leaveTable({
                        reason: "wallet_low"
                    }, {
                        _id: userInfos[i]._id.toString(),
                        tbid: tb._id.toString(),
                        seatIndex: userSeatIndexs[userInfos[i]._id.toString()],
                        sck: userInfos[i].sck,
                    })
                    //delete index frm array
                    playerInfo.splice(userSeatIndexs[userInfos[i]._id.toString()], 1);
                    delete userSeatIndexs[userInfos[i]._id.toString()];
                }
            }

        return playerInfo;
    } catch (error) {
        logger.error("checkUserInRound error ->", error)
    }
}

module.exports.getCount = async (type) => {
    let wh = {
        type: type
    }
    let update = {
        $set: {
            type: type
        },
        $inc: {
            counter: 1
        }
    }
    logger.info("\ngetUserCount wh : ", wh, update);

    let resp2 = await IdCounter.findOneAndUpdate(wh, update, { upsert: true, new: true });
    return resp2.counter;
}

