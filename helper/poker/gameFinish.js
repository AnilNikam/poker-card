
const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const PlayingTables = require("../../models/playingTables");

const gameTrackActions = require("./gameTrack");
const commandAcions = require("../socketFunctions");


const CONST = require("../../constant");
const checkUserCardActions = require("./checkUserCard");
const roundEndActions = require("./roundEnd");
const roundStartActions = require("./roundStart");
const walletActions = require("./updateWallet");
const logger = require("../../logger");
const { Logger } = require("mongodb");

module.exports.lastUserWinnerDeclareCall = async (tb) => {
    if (tb.isLastUserFinish) return false;
    const upWh = {
        _id: tb._id,
    }
    const updateData = {
        $set: {
            "isLastUserFinish": true
        }
    };
    logger.info("lastUserWinnerDeclareCall upWh updateData :: ", upWh, updateData);

    const tabInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
    logger.info("lastUserWinnerDeclareCall tabInfo : ", tabInfo);
    let winner = {};
    for (var i = 0; i < tabInfo.playerInfo.length; i++) {
        if (typeof tabInfo.playerInfo[i].seatIndex != "undefined" && tabInfo.playerInfo[i].status == "play") {
            winner = tabInfo.playerInfo[i];
        }
    }
    if (winner == {}) return false;

    logger.info("lastUserWinnerDeclareCall winner ::", winner);



    let dcUWh = {
        _id: MongoID(tb._id.toString()),
        "playerInfo.seatIndex": Number(winner.seatIndex)
    }
    let up = {
        $set: {
            "playerInfo.$.playStatus": "winner",
        }
    }
    const tbInfo = await PlayingTables.findOneAndUpdate(dcUWh, up, { new: true });
    logger.info("lastUserWinnerDeclareCall tbInfo : ", tbInfo);

    await this.winnerDeclareCall([winner], tabInfo);
    return true;

}

module.exports.winnerDeclareCall = async (winner, tabInfo) => {
    try {
        logger.info("winnerDeclareCall winner ::  -->", winner, tabInfo);
        let tbid = tabInfo._id.toString()
        logger.info("winnerDeclareCall tbid ::", tbid);

        if (typeof winner == "undefined" || (typeof winner != "undefined" && winner.length == 0)) {
            logger.info("winnerDeclareCall winner ::", winner);
            return false;
        }

        if (tabInfo.gameState == "RoundEndState") return false;
        if (tabInfo.isFinalWinner) return false;

        const upWh = {
            _id: tbid
        }
        const updateData = {
            $set: {
                "isFinalWinner": true,
                gameState: "RoundEndState",
            }
        };
        logger.info("winnerDeclareCall upWh updateData :: ", upWh, updateData);

        const tbInfo = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("winnerDeclareCall tbInfo : ", tbInfo);

        let winnerIndexs = [];
        let winnerIds = [];

        // players = players.sort((a, b) => {
        //     return b.WinnerData.cardvalue  - a.WinnerData.cardvalue 
        // }).sort((a, b) => {
        //     return b.WinnerData.winvalue - a.WinnerData.winvalue
        // })
        let TotalUserWinner = []
        for (let i = 0; i < winner.length; i++) {
            logger.info("winner[0].winvalue ::", winner[0].WinnerData.winvalue);
            logger.info("winner[i].winvalue ::", winner[i].WinnerData.winvalue);

            logger.info("winner[0].cardvalue ::", winner[0].WinnerData.cardvalue);
            logger.info("winner[i].cardvalue ::", winner[i].WinnerData.cardvalue);


            logger.info("TotalUserWinner ::", TotalUserWinner);


            if (winner[0].WinnerData.winvalue == winner[i].WinnerData.winvalue && winner[0].WinnerData.cardvalue == winner[i].WinnerData.cardvalue) {
                TotalUserWinner.push(winner[i])
            }
            winnerIndexs.push(winner[i].seatIndex);
            winnerIds.push(winner[i]._id)
        }
        const playerInGame = await roundStartActions.getPlayingUserInRound(tbInfo.playerInfo);
        logger.info("getWinner playerInGame ::", playerInGame);

        // for (let i = 0; i < playerInGame.length; i++) {
        //     let winnerState = checkUserCardActions.getWinState(playerInGame[i].cards, tbInfo.hukum);
        //     logger.info("winnerState FETCH::", winnerState);

        //     tbInfo.gameTracks.push(
        //         {
        //             _id: playerInGame[i]._id,
        //             username: playerInGame[i].username,
        //             seatIndex: playerInGame[i].seatIndex,
        //             cards: playerInGame[i].cards,
        //             totalBet: playerInGame[i].totalBet,
        //             playStatus: (winnerIndexs.indexOf(playerInGame[i].seatIndex) != -1) ? "win" : "loss",
        //             winningCardStatus: winnerState.status
        //         }
        //     )
        // }

        //logger.info("winnerDeclareCall tbInfo.gameTracks :: ", tbInfo.gameTracks, winnerIds);

        //const winnerTrack = await gameTrackActions.gamePlayTracks(winnerIndexs, tbInfo.gameTracks, tbInfo);
        //logger.info("winnerDeclareCall winnerTrack:: ", winnerTrack);

        for (let i = 0; i < TotalUserWinner.length; i++) {
            if (TotalUserWinner[i]._id != undefined) {
                await walletActions.addWallet(TotalUserWinner[i]._id, Number(tbInfo.potValue) / TotalUserWinner.length, 4, "poker Win", tabInfo);
                TotalUserWinner[i].WinGold = Number(tbInfo.potValue) / TotalUserWinner.length
            }
        }

        // let winnerViewResponse = await this.winnerViewResponseFilter(tbInfo.gameTracks, winnerTrack, winnerIndexs);
        // winnerViewResponse.gameId = tbInfo.gameId;
        // winnerViewResponse.winnerIds = tbInfo.winnerIds;

        let winnerViewResponse = {
            winneruser: TotalUserWinner,
            alluser: winner,
            potValue: tbInfo.potValue
        }
        commandAcions.sendEventInTable(tbInfo._id.toString(), CONST.WINNER, winnerViewResponse);

        setTimeout(() => {
            roundEndActions.roundFinish(tbInfo);
        }, 5000)
    } catch (err) {
        logger.info("Exception  WinnerDeclareCall : 1 :: ", err)
    }
}

module.exports.winnerViewResponseFilter = (playerInfos, winnerTrack, winnerIndexs) => {
    logger.info("winnerViewResponseFilter playerInfo : ", playerInfos);
    let userInfo = [];
    let playerInfo = playerInfos;

    for (let i = 0; i < playerInfo.length; i++) {
        if (typeof playerInfo[i].seatIndex != "undefined") {
            logger.info("winnerViewResponseFilter playerInfo[i] : ", playerInfo[i]);
            userInfo.push({
                _id: playerInfo[i]._id,
                seatIndex: playerInfo[i].seatIndex,
                cards: playerInfo[i].cards,
                playStatus: playerInfo[i].playStatus,
                cardStatus: playerInfo[i].winningCardStatus
            })
        }
    }
    return {
        winnerSeatIndex: winnerIndexs,
        winningAmount: winnerTrack.winningAmount,
        userInfo: userInfo
    }
}