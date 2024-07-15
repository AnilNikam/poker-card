const mongoose = require('mongoose');
const GameUser = require('../../models/users');
const commonHelper = require('../commonHelper');
const commandAcions = require("../socketFunctions");
const CONST = require("../../constant");
const logger = require('../../logger');
const joinTable = require("./joinTable");
const gamePlay = require("./gamePlay");
const cardLogic = require("./cardLogic");



module.exports.JoinRobot = async (tableInfo, BetInfo) => {
    try {

        let user_wh = {
            isBot: true,
            isfree: true,
        }

        let robotInfo = await GameUser.findOne(user_wh, {});
        logger.info("JoinRobot ROBOT Info : ", robotInfo)


        await joinTable.findEmptySeatAndUserSeat(tableInfo, BetInfo, { isBot: true, uid: robotInfo._id, id: robotInfo._id });

    } catch (error) {
        logger.info("Robot Logic Join", error);
    }
}
/*
    {
        si: 1,
        smallblind: 1,
        bigblind: 0,
        smallblindSeatIndex: 1,
        bigblindSeatIndex: 0,
        bet: 1,
        check: 0,
        allIn: 0,
        fold: 1,
        raise: 1,
        type: '',
        isturn: -1,
        minbet: 1,
        maxbet: 100,
        call: 1
    }
*/
module.exports.PlayRobot = async (tableInfo, BetInfo, turnuserData) => {
    try {

        setTimeout(async () => {


            // Play Robot Logic 
            logger.info("PlayRobot ", tableInfo)
            logger.info("BetInfo ", BetInfo)
            logger.info("BetInfo ", turnuserData)
            let client = { tbid: tableInfo._id.toString(), TAC: false, sck: "", seatIndex: BetInfo.seatIndex, uid: BetInfo._id.toString(), socketid: "" }
            if (turnuserData.check == 1) {
                await gamePlay.TAKEACTION({
                    type: "check", //"call" || raise || All In
                    bet: 0
                }, client);
            } else if (turnuserData.call == 1) {
                await gamePlay.TAKEACTION({
                    type: "call", //"call" || raise || All In
                    bet: turnuserData.bet
                }, client);
            } else if (turnuserData.raise == 1) {
                await gamePlay.TAKEACTION({
                    type: "call", //"call" || raise || All In
                    bet: turnuserData.bet * 2
                }, client);
            }
        }, 10000);
        // return false

        // if (BetInfo != undefined && BetInfo.playerId != undefined && tableInfo._id != undefined) {


        //     console.log(cardLogic.GetRandomInt(0, 1))

        //     let robotCardValue = cardLogic.valueOfCard(BetInfo.cards)

        //     console.log("robotCardValue .info ", robotCardValue)

        //     console.log("BetInfo.playStatus ", BetInfo.playStatus)


        //     //robotCardValue 1 2 3 4 5 

        //     if (BetInfo.isSee) {
        //         //chal Valu Funcation call
        //         console.log("BetInfo.playStatus ", BetInfo.isSee)
        //         //1. check potlimit over ho gaya tha ke nahi
        //         if (robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3) {
        //             // double chalValue value and Chal
        //             //Chal chalValue 
        //             gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

        //         } else if (robotCardValue == 2 || robotCardValue == 1) {
        //             //Chal chalValue Normal
        //             gamePlay.chal({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })


        //         } else {

        //             console.log("playerInGame ", playerInGame)
        //             if (cardLogic.GetRandomInt(0, 10) >= 8) {
        //                 if (playerInGame.length == 2) {
        //                     gamePlay.show({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
        //                 } else {
        //                     console.log("card PAck ")
        //                     gamePlay.cardPack({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

        //                 }
        //             } else {
        //                 gamePlay.chal({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

        //             }

        //         }


        //     } else {
        //         //Blind Valu Funcation call
        //         //1. check potlimit over ho gaya tha ke nahi
        //         logger.info("Blind  BetInfo.playStatus ", BetInfo.playStatus);

        //         gamePlay.seeCard({}, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })



        //         if (robotCardValue == 5 || robotCardValue == 4 || robotCardValue == 3) {
        //             // double chalValue  value and Chal
        //             //Blind chalValue 
        //             gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

        //             logger.info("Blind  robotCardValue  5 4 3 ", robotCardValue);

        //         } else if (robotCardValue == 2 || robotCardValue == 1) {
        //             //Blind chalValue Normal
        //             if (cardLogic.GetRandomInt(0, 1)) {
        //                 gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
        //             } else {
        //                 gamePlay.chal({ isIncrement: false }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
        //             }
        //             logger.info("Blind  robotCardValue  2 1 ", robotCardValue);

        //         } else {
        //             logger.info("Blind  robotCardValue  else  ", robotCardValue);

        //             if (tableInfo.potLimit / 4 <= tableInfo.potValue && cardLogic.GetRandomInt(0, 1)) {
        //                 // Card Seen 
        //                 gamePlay.seeCard({}, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })

        //             } else {
        //                 gamePlay.chal({ isIncrement: true }, { uid: BetInfo.playerId, tbid: tableInfo._id, seatIndex: BetInfo.seatIndex, sck: "" })
        //             }

        //         }
        //     }
        // } else {
        //     logger.info("PlayRobot else  Robot ", tableInfo, BetInfo);

        // }

    } catch (error) {
        logger.info("Play Robot ", error);
    }
}