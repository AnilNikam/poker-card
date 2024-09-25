const mongoose = require('mongoose');
const GameUser = mongoose.model('users');
const MongoID = mongoose.Types.ObjectId;
const PlayingTables = mongoose.model("dicePlayingTables");

const commonHelper = require('../../helper/commonHelper');
const commandAcions = require("../../helper/socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const gamePlay = require("./gamePlay");
const cardLogic = require("./cardLogic");



module.exports.JoinRobot = async (tableInfoo, BetInfo) => {
    try {
        let realPlayer = []

        let whereCond = { _id: MongoID(tableInfoo._id.toString()) };
        let tableInfo = await PlayingTables.findOne(whereCond).lean();
        logger.info("botfunction tabInfo =>", tableInfo);

        tableInfo.playerInfo.forEach(e => {
            logger.info("tableInfo.playerInfo ", e)
            if (e.isBot == false) {
                realPlayer.push(MongoID(e._id).toString())
            }
        })

        if (realPlayer.length == 0) {
            logger.info("Real USer Leght zero ", realPlayer.length);
            return false
        }

        let user_wh = {
            isBot: true,
            isfree: true,
        }

        // Count the total number of documents that match the criteria
        let totalCount = await GameUser.countDocuments(user_wh);

        // Generate a random index within the range of totalCount
        let randomIndex = Math.floor(Math.random() * totalCount);

        // Aggregate pipeline to skip to the random index and limit to 1 document
        let pipeline = [
            { $match: user_wh },
            { $skip: randomIndex },
            { $limit: 1 }
        ];

        // Execute the aggregation pipeline
        let robotInfo = await GameUser.aggregate(pipeline).exec();
        logger.info("point JoinRobot ROBOT Info : ", robotInfo)

        if (robotInfo == null || robotInfo.length == 0) {
            logger.info("JoinRobot ROBOT Not Found  : ")
            return false
        }

        let up = await GameUser.updateOne({ _id: MongoID(robotInfo[0]._id.toString()) }, { $set: { "isfree": false } });
        logger.info("update robot isfree", up)


        await joinTable.findEmptySeatAndUserSeat(tableInfo, BetInfo, { uid: robotInfo[0]._id.toString(), isBot: robotInfo[0].isBot });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}

module.exports.PlayRobot = async (tableInfo, BetInfo, playerInGame) => {
    try {

        // Play Robot Logic 
        logger.info("PlayRobot ", tableInfo)
        logger.info("BetInfo ", BetInfo)

        if (BetInfo != undefined && BetInfo.playerId != undefined && tableInfo._id != undefined) {


            logger.info(cardLogic.GetRandomInt(0, 1))

            let robotCardValue = cardLogic.valueOfCard(BetInfo.cards)

            logger.info("robotCardValue .info ", robotCardValue)

            logger.info("BetInfo.playStatus ", BetInfo.playStatus)


            //robotCardValue 1 2 3 4 5 

            if (BetInfo.isSee) {
                //chal Valu Funcation call
                logger.info("BetInfo.playStatus ", BetInfo.isSee)
                //1. check potlimit over ho gaya tha ke nahi
                if (robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3) {
                    // double chalValue value and Chal
                    //Chal chalValue 
                    gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

                } else if (robotCardValue == 2 || robotCardValue == 1) {
                    //Chal chalValue Normal
                    gamePlay.chal({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })


                } else {

                    logger.info("playerInGame ", playerInGame)
                    if (cardLogic.GetRandomInt(0, 10) >= 8) {
                        if (playerInGame.length == 2) {
                            gamePlay.show({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
                        } else {
                            logger.info("card PAck ")
                            gamePlay.cardPack({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

                        }
                    } else {
                        gamePlay.chal({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

                    }

                }


            } else {
                //Blind Valu Funcation call
                //1. check potlimit over ho gaya tha ke nahi
                logger.info("Blind  BetInfo.playStatus ", BetInfo.playStatus);

                gamePlay.seeCard({}, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })



                if (robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3) {
                    // double chalValue  value and Chal
                    //Blind chalValue 
                    gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

                    logger.info("Blind  robotCardValue  5 4 3 ", robotCardValue);

                } else if (robotCardValue == 2 || robotCardValue == 1) {
                    //Blind chalValue Normal
                    if (cardLogic.GetRandomInt(0, 1)) {
                        gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
                    } else {
                        gamePlay.chal({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
                    }
                    logger.info("Blind  robotCardValue  2 1 ", robotCardValue);

                } else {
                    logger.info("Blind  robotCardValue  else  ", robotCardValue);

                    if (tableInfo.potLimit / 4 <= tableInfo.potValue && cardLogic.GetRandomInt(0, 1)) {
                        // Card Seen 
                        gamePlay.seeCard({}, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

                    } else {
                        gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
                    }

                }
            }
        } else {
            logger.info("PlayRobot else  Robot ", tableInfo, BetInfo);

        }

    } catch (error) {
        logger.info("Play Robot ", error);
    }
}