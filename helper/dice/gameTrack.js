const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;
const GamePlayTracks = mongoose.model("gamePlayTracks");
const logger = require("../../logger");


module.exports.gamePlayTracks = async (winner_indexs, playersInfo, table) => {
    try {
        logger.info("\ngamePlayTracks  winner_indexs : ", winner_indexs);
        logger.info("\ngamePlayTracks  playersInfo : ", playersInfo);
        logger.info("\ngamePlayTracks  table : ", table);

        let totalBet = Number(table.tableAmount);
        let winningAmount = (1 - (table.entryFee / 100)) * totalBet;

        logger.info("\ngamePlayTracks  winningAmount : ", winningAmount);

        let rake = totalBet - winningAmount;
        logger.info("\ngamePlayTracks  rake : ", rake);

        if (winner_indexs.length > 1) {
            winningAmount = Math.floor(winningAmount / Number(winner_indexs.length));
        }

        winningAmount = Number(winningAmount.toFixed(2))
        logger.info("gamePlayTracks winningAmount  :: ", winningAmount, rake)

        for (let i = 0; i < playersInfo.length; i++) {
            logger.info("gamePlayTracks Total playersInfo.total_bet ::", playersInfo[i].totalBet)
            let pushData = {
                tableId: MongoID(table._id),
                gameId: Number(table.gameId),
                userId: MongoID(playersInfo[i]._id),
                deductAmount: playersInfo[i].totalBet,
                entryFee: Number(table.entryFee),
                winningAmount: (playersInfo[i].playerStatus == "win") ? winningAmount : 0,
                winningStatus: playersInfo[i].playerStatus,
                winningCardStatus: playersInfo[i].winningCardStatus,
                betValue: Number(table.entryFee)
            }
            logger.info("gamePlayTracks Total pushData ::", pushData)
            await GamePlayTracks.create(pushData);
        }

        return {
            winningAmount: winningAmount
        }
    } catch (e) {
        logger.error("gamePlayTracks : 1 : Exception :", e)
        return {
            winningAmount: 0,
        }
    }
}