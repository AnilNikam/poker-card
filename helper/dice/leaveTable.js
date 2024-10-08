const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const PlayingTables = mongoose.model("dicePlayingTables");
const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const commandAcions = require("../../helper/socketFunctions");
const roundStartActions = require("./roundStart")
const gameFinishActions = require("./gameFinish");
const logger = require("../../logger");
const { filterBeforeSendSPEvent, getPlayingUserInTable, getPlayingRealUserInRound } = require("../common-function/manageUserFunction");


module.exports.leaveTable = async (requestData, client) => {
    requestData = (requestData != null) ? requestData : {}
    if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
        commandAcions.sendDirectEvent(client.sck, CONST.DICE_LEAVE_TABLE, requestData, false, "User session not set, please restart game!");
        return false;
    }

    let userWh = {
        _id: MongoID(client.uid.toString()),
    }
    let userInfo = await GameUser.findOne(userWh, {});
    logger.info("leaveTable userInfo : ", userInfo)

    let wh = {
        _id: MongoID(client.tbid.toString()),
        "playerInfo._id": MongoID(client.uid.toString())
    };
    let tb = await PlayingTables.findOne(wh, {});
    logger.info("leaveTable tb : ", tb);

    if (tb == null) {
        return false;
    }

    if (typeof client.id != "undefined") {
        client.leave(tb._id.toString());
    }

    let reason = (requestData != null && typeof requestData.reason != "undefined" && requestData.reason) ? requestData.reason : "ManuallyLeave"
    let playerInfo = tb.playerInfo[client.seatIndex];
    logger.info("leaveTable playerInfo : =>", playerInfo)

    let updateData = {
        $set: {
            "playerInfo.$": {}
        },
        $inc: {
            activePlayer: -1
        }
    }
    if (tb.activePlayer == 2 && tb.gameState == "GameStartTimer") {
        let jobId = CONST.GAME_START_TIMER + ":" + tb._id.toString();
        commandAcions.clearJob(jobId)
        updateData["$set"]["gameState"] = "";
    }
    if (tb.activePlayer == 1) {
        let jobId = "LEAVE_SINGLE_USER:" + tb._id;
        commandAcions.clearJob(jobId)
    }

    if (tb.gameState == "RoundStated") {
        if (client.seatIndex == tb.turnSeatIndex) {
            commandAcions.clearJob(tb.jobId)
        }
        if (playerInfo.slectDice == true) {
            if (["play"].indexOf(playerInfo.playerStatus) != -1) {

                let userTrack = {
                    _id: playerInfo._id,
                    username: playerInfo.username,
                    playerDice: playerInfo.selectedDiceNumber,
                    seatIndex: playerInfo.seatIndex,
                    // totalBet: playerInfo.totalBet,
                    playerStatus: "leaveTable"
                }
                updateData["$push"] = {
                    "gameTracks": userTrack
                }
            }
        }
    }

    logger.info("leaveTable updateData : ", wh, updateData);

    let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
        new: true,
    });
    logger.info("checl leave update -->", tbInfo)

    if (!tbInfo) {
        return;
    }


    let activePlayerInRound = await getPlayingUserInTable(tbInfo.playerInfo);
    logger.info("leaveTable activePlayerInRound : Check =>", activePlayerInRound);


    let response = {
        reason: reason,
        tbid: tb._id,
        seatIndex: client.seatIndex,
        ap: activePlayerInRound.length,
    }

    // let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, { new: true });
    // logger.info("leaveTable tbInfo : ", tbInfo);

    commandAcions.sendDirectEvent(client.sck.toString(), CONST.DICE_LEAVE_TABLE, response);
    commandAcions.sendEventInTable(tb._id.toString(), CONST.DICE_LEAVE_TABLE, response);

    let userDetails = await GameUser.findOne({
        _id: MongoID(client.uid.toString()),
    }).lean();

    logger.info("check user Details =>", userDetails)

    let finaldata = await filterBeforeSendSPEvent(userDetails);

    logger.info("check user Details finaldata =>", finaldata)

    commandAcions.sendDirectEvent(client.sck.toString(), CONST.DASHBOARD, finaldata);

    await this.manageOnUserLeave(tbInfo, client);
}

module.exports.manageOnUserLeave = async (tb, client) => {
    logger.info("\nmanageOnUserLeave tb : ", tb);

    const playerInGame = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
    logger.info("manageOnUserLeave playerInGame : ", playerInGame);

    const realPlayerInGame = await getPlayingRealUserInRound(tb.playerInfo);

    const list = ['RoundStated', 'CollectBoot', 'CardDealing', 'SelectDiceNumber'];

    if (list.includes(tb.gameState) && tb.currentPlayerTurnIndex === client.seatIndex) {
        if (playerInGame.length == 0) {
            if (tb.activePlayer === 0) {
                let wh = {
                    _id: MongoID(tb._id.toString()),
                };
                await PlayingTables.deleteOne(wh);
            }
        } if (realPlayerInGame.length == 0) {
            await this.leaveallrobot(tb._id)
        }
        else if (playerInGame.length >= 2) {
            await roundStartActions.nextUserTurnstart(tb, false);
        } else if (playerInGame.length === 1) {
            if (playerInGame[0].isBot) {
                let wh = {
                    _id: MongoID(tb._id.toString()),
                    'playerInfo.isBot': true,
                };

                logger.info("check bot details remove ==>", wh)

                let updateData = {
                    $set: {
                        'playerInfo.$': {},
                    },
                    $inc: {
                        activePlayer: -1,
                    },
                };

                let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
                    new: true,
                });
                logger.info("remove robot tbInfo", tbInfo)
                logger.info("Leave remove robot playerInGame[0] ", playerInGame[0])


                if (tbInfo) {

                    await GameUser.updateOne({ _id: MongoID(playerInGame[0]._id.toString()) }, { $set: { "isfree": true } });

                    if (tbInfo.activePlayer === 0) {
                        let wh = {
                            _id: MongoID(tbInfo._id.toString()),
                        };
                        await PlayingTables.deleteOne(wh);
                    }
                } else {
                    logger.info("tbInfo not found");
                }
            }
            await roundStartActions.nextUserTurnstart(tb);
        }
    } else if (list.includes(tb.gameState) && tb.currentPlayerTurnIndex !== client.seatIndex) {

        if (playerInGame.length == 0) {
            await this.leaveallrobot(tb._id)
            if (tb.activePlayer === 0) {
                let wh = {
                    _id: MongoID(tb._id.toString()),
                };
                await PlayingTables.deleteOne(wh);
            }
        } else if (playerInGame.length === 1) {
            if (playerInGame[0].isBot) {
                let wh = {
                    _id: MongoID(tb._id.toString()),
                    'playerInfo.isBot': true,
                };

                logger.info("check bot details remove ==>", wh)

                let updateData = {
                    $set: {
                        'playerInfo.$': {},
                    },
                    $inc: {
                        activePlayer: -1,
                    },
                };

                let tbInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
                    new: true,
                });
                logger.info("remove robot tbInfo", tbInfo)
                logger.info("Leave remove robot playerInGame[0] ", playerInGame[0])


                if (tbInfo) {

                    await GameUser.updateOne({ _id: MongoID(playerInGame[0]._id.toString()) }, { $set: { "isfree": true } });

                    if (tbInfo.activePlayer === 0) {
                        let wh = {
                            _id: MongoID(tbInfo._id.toString()),
                        };
                        await PlayingTables.deleteOne(wh);
                    }
                } else {
                    logger.info("tbInfo not found");
                }
            }
            await gameFinishActions.lastUserWinnerDeclareCall(tb);
        }
    } else if (["", "GameStartTimer"].indexOf(tb.gameState) != -1) {
        if (playerInGame.length == 0 && tb.activePlayer == 0) {
            let wh = {
                _id: MongoID(tb._id.toString())
            }
            await PlayingTables.deleteOne(wh);
        } else if (tb.activePlayer == 0) {
            this.leaveSingleUser(tb._id)
        }
    }

}

module.exports.leaveSingleUser = async (tbid) => {
    logger.info("leaveSingleUser call tbid : ", tbid);
    let tbId = tbid
    let jobId = "LEAVE_SINGLE_USER:" + tbid;
    let delay = commandAcions.AddTime(120);
    const delayRes = await commandAcions.setDelay(jobId, new Date(delay));
    logger.info("leaveSingleUser delayRes : ", delayRes);

    const wh1 = {
        _id: MongoID(tbId.toString())
    }
    const tabInfo = await PlayingTables.findOne(wh1, {}).lean();
    logger.info("leaveSingleUser tabInfo : ", tabInfo);
    if (tabInfo.activePlayer == 1) {
        let playerInfos = tabInfo.playerInfo
        for (let i = 0; i < playerInfos.length; i++) {
            if (typeof playerInfos[i].seatIndex != "undefined") {
                await this.leaveTable({
                    reason: "singleUserLeave"
                }, {
                    uid: playerInfos[i]._id.toString(),
                    tbid: tabInfo._id.toString(),
                    seatIndex: playerInfos[i].seatIndex,
                    sck: playerInfos[i].sck,
                })
            }
        }

    }
}

module.exports.leaveallrobot = async (tbid) => {
    try {
        logger.info("check all leave robot =>");
        let tbId = tbid;

        const wh1 = {
            _id: MongoID(tbId.toString()),
        };
        logger.info("check all leave robot wh1=>", wh1);

        let tabInfo = await PlayingTables.findOne(wh1, {}).lean();
        logger.info("check all leave robot tabInfo=>", tabInfo);

        if (!tabInfo) {
            logger.info("Table not found for robot removal");
            return;
        }

        let playerInfos = tabInfo.playerInfo;
        for (let i = 0; i < playerInfos.length; i++) {
            logger.info("check loop", playerInfos[i]);
            if (playerInfos[i].isBot) {
                let wh = {
                    _id: MongoID(tbId.toString()),
                    'playerInfo._id': playerInfos[i]._id,
                };

                logger.info("check bot details remove ==>", wh);

                let updateData = {
                    $set: {
                        [`playerInfo.${i}`]: {} // Set the element at index i to an empty object
                    },
                    $inc: {
                        activePlayer: -1,
                    },
                };

                // tabInfo = await PlayingTables.updateOne(wh, updateData);
                tabInfo = await PlayingTables.findOneAndUpdate(wh, updateData, {
                    new: true,
                });
                logger.info("check table after robot =>", tabInfo)

                await GameUser.updateOne({ _id: MongoID(playerInfos[i]._id.toString()) }, { $set: { "isfree": true } });

                let response = {
                    pi: playerInfos[i]._id,
                    lostChips: 0,
                    totalRewardCoins: tabInfo.tableAmount,
                    ap: tabInfo.activePlayer,
                };
                commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.DICE_LEAVE_TABLE, response);

            }
        }

        if (tabInfo.activePlayer === 0) {
            let wh = {
                _id: MongoID(tbId.toString()),
            };
            await PlayingTables.deleteOne(wh);
        }
        return tabInfo;
    } catch (e) {
        logger.error('leaveTable.js leaveallrobot error : ', e);
    }
};