const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const PlayingTables = mongoose.model("playingTables");
const GameUser = mongoose.model("users");

const CONST = require("../../constant");
const logger = require("../../logger");
const commandAcions = require("../socketFunctions");
const roundStartActions = require("./roundStart");
const gameFinishActions = require("./gameFinish");
const checkWinnerActions = require("./checkWinner");
const checkUserCardActions = require("./checkUserCard");

const walletActions = require("./updateWallet");
const cardDealActions = require("./cardDeal");

/*
        TAKEACTION Contract
        Data:{
            type : "", "call" || raise || All In
            bet:10
        }

        TAKEACTION  same and  round finish 

    */
module.exports.TAKEACTION = async (requestData, client) => {
    logger.info("requestData ", requestData)
    //logger.info("client ",client)

    if (typeof client.tbid == 'undefined' || requestData.type == undefined || requestData.bet == undefined) {
        commandAcions.sendDirectEvent(client.sck, CONST.TAKEACTION, requestData, false, "User session not set, please restart game!");
        return false;
    }
    if (typeof client.TAC != "undefined" && client.TAC) {
        logger.info("TAC RErturn ::");
        return false;
    }
    client.TAC = true;


    const wh = {
        _id: MongoID(client.tbid.toString())
    }
    const project = {

    }
    const tabInfo = await PlayingTables.findOne(wh, project).lean();


    if (tabInfo == null) {
        logger.info("chal user not turn ::", tabInfo);
        delete client.TAC;
        return false
    }
    if (tabInfo.turnDone) {
        logger.info("chal : client.su ::", client.seatIndex);
        delete client.TAC;
        commandAcions.sendDirectEvent(client.sck, CONST.TAKEACTION, requestData, false, "Turn is already taken!");
        return false;
    }
    if (tabInfo.turnSeatIndex != client.seatIndex) {
        logger.info("chal : client.su ::", client.seatIndex);
        delete client.TAC;
        commandAcions.sendDirectEvent(client.sck, CONST.TAKEACTION, requestData, false, "It's not your turn!");
        return false;
    }

    // var maxcontract;
    // if (tabInfo.contract.length > 0) {
    //     maxcontract = _.max(tabInfo.contract, function (o) { return parseInt(o.contract) });
    // }

    // si:playerInfo[i].seatIndex,
    // smallblind:(playerInfo[i].seatIndex == tb.smallblindSeatIndex)?playerInfo[i].seatIndex:-1,
    // bigblind:(playerInfo[i].seatIndex == tb.bigblindSeatIndex)?playerInfo[i].seatIndex:-1,
    // bet:(playerInfo[i].seatIndex == tb.smallblindSeatIndex)?smallblind:(playerInfo[i].seatIndex == tb.bigblindSeatIndex)?bigblind:0,
    // check:-1,
    // allIn:-1,
    // fold:-1,
    // raise:-1

    var Set = {
        $set: {

        }
    }
    let foundIndex = -1
    logger.info("tabInfo.contract ", tabInfo.contract)

    if (tabInfo.contract.length > 0) {
        //_.map(tabInfo.contract, function (el) { return el.islastcontract = false; });
        foundIndex = tabInfo.contract.findIndex(x => x.si == client.seatIndex);
    }


    

    if (foundIndex != -1) {
        tabInfo.contract[foundIndex].bet = tabInfo.contract[foundIndex].bet + parseInt(requestData.bet)
        tabInfo.contract[foundIndex].type = requestData.type
        tabInfo.contract[foundIndex].isturn = 1

        if (requestData.type == "fold") {
            tabInfo.contract[foundIndex].fold = 1;
        }
        if (requestData.type == "allIn") {
            tabInfo.contract[foundIndex].allIn = 1;
        }

        Set["$set"]["contract"] = tabInfo.contract;
        Set["$set"]["playerInfo." + client.seatIndex + ".turnMissCounter"] = 0;
        //Set["$set"]["playerInfo." + client.seatIndex + ".bet"] = 0;

        await walletActions.deductWallet(client.uid, -parseInt(requestData.bet), 1, "Poker Bet", tabInfo, client.socketid, tabInfo.playerInfo[client.seatIndex].seatIndex);

    } else {
        logger.info("ddddddddddddddddddddddddddddddddddd ELSE KKKKKKKKKKKKK")
        // var jdt = {
        //     "suit": data.suit,
        //     "contract": data.contract,
        //     "status": "TAKE",
        //     "uid": tabInfo.pi[client.seatIndex].ui.uid,
        //     "si": parseInt(client.seatIndex),
        //     "islastcontract": true
        // }
        // tabInfo.contract.push(jdt)
        // Set["$set"]["contract"] = tabInfo.contract;
        // Set["$set"]["pi." + client.seatIndex + ".turn_miss_cont"] = 0;
    }

    var WH = { _id: MongoID(client.tbid.toString()) };


    const updated = await PlayingTables.findOneAndUpdate(WH, Set, { new: true });
    logger.info("chal updated : ", updated);


    if (updated == null) {
        trackClass.trackingplayingerror(client, CONST.TAKEACTION, { data: requestData, tb: updated }, 'error:TAC003');
        return false;
    }


    commandAcions.clearJob(tabInfo.job_id);
    commandAcions.sendEventInTable(updated._id.toString(), CONST.TAKEACTION, {
      
        type: requestData.type,
        bet: requestData.bet,
        si: client.seatIndex
    });

    delete client.TAC;
    //All User Bet same and Check After Round Change 
    // Check also same bet and 

    let oneuser = updated.contract.filter((e) => {
        return (e.isturn == 1 && e.fold != 1)
    })

    let comparebet = -1
    if (oneuser.length > 0) {
        comparebet = oneuser[0].bet
        logger.info("oneuser ::::::::::::::::::::::: ", oneuser[0].bet)
    }

    logger.info("comparebet ::::::::::::::::::::::: ", comparebet)


    let allusersamebet = updated.contract.filter((e) => {
        return ((e.isturn == 1 || e.fold == 1) && (e.bet == comparebet || e.fold == 1))
    })

    let allfolduser = updated.contract.filter((e) => {
        return  e.fold != 1
    })

    logger.info("allusersamebet ", allusersamebet)
    logger.info("updated.contract ", updated.contract)
    
    logger.info("updated.contract ", updated.contract.length, allusersamebet.length)


    if (allusersamebet.length == updated.contract.length) {

        //Round change 
        //Open One Card and change turn 
        //If 5 Card and Won Game 
        if (updated.communitycard.length >= 5) {
            // Go To Win 
            console.log("WINER :::::::::::::::::::::::::::::")

            checkWinnerActions.winnercall(updated)

        } else {
            this.OpenNextcard(updated)
        }

    } else if (allfolduser.length == 1){
        // Winner 
        console.log("Winner :::::::::::::::::: allfolduser ",allfolduser)
        checkWinnerActions.winnercall(updated)
    } else {
        await roundStartActions.nextUserTurnstart(updated);
    }


    // If not same after start again 

}

module.exports.OpenNextcard = async (tb) => {
    logger.info("tb ",tb.round)
    //
    if (tb.round == 1) {
        let Communitycard = cardDealActions.getCards_communitycard(3, tb)

        if (Communitycard.cards != undefined && Communitycard.deckCards) {

            var WH = { _id: MongoID(tb._id.toString()) };
            
            let totalbet = 0;

            tb.contract.forEach((e) => {
                
                totalbet = totalbet + e.bet;
                
                e.isturn = -1;
                e.bet = 0;
            });
            logger.info("tb.contract ", tb.contract)
            logger.info("tb.totalbet  ",totalbet)
            
            var Set = {
                $set: {
                    communitycard: Communitycard.cards,
                    deckCards: Communitycard.deckCards,
                    contract:tb.contract
                },
                $inc:{
                    round: 1,
                    potValue: totalbet
                
                }
            }
            const updated = await PlayingTables.findOneAndUpdate(WH, Set, { new: true });
            logger.info("updated  updated  : ", updated);

            commandAcions.sendEventInTable(updated._id.toString(), CONST.OPENCARD, {
                contract: updated.contract,
                communitycard: updated.communitycard,
                opencard: Communitycard.cards,
                potValue:updated.potValue
            });

            setTimeout(()=>{
                roundStartActions.nextUserTurnstart(updated);
            },12000)

        } else {
            logger.info("undefined  ", Communitycard)
        }

    } else {
        let Communitycard = cardDealActions.getCards_communitycard(1, tb)

        if (Communitycard.cards != undefined && Communitycard.deckCards) {

            var WH = { _id: MongoID(tb._id.toString()) };
           
            let totalbet = 0;

            tb.contract.forEach((e) => {

                totalbet = totalbet + e.bet;
                

                e.isturn = -1;
                e.bet = 0;
            });

            logger.info("tb.totalbet  ",totalbet)

            var Set = {
                $push: {
                    communitycard: Communitycard.cards,
                },
                $set: {
                    deckCards: Communitycard.deckCards,
                    contract:tb.contract
                },
                $inc: {
                    round: 1,
                    potValue:totalbet
                }
            }

            const updated = await PlayingTables.findOneAndUpdate(WH, Set, { new: true });
            logger.info("updated  updated  : ", updated);

            commandAcions.sendEventInTable(updated._id.toString(), CONST.OPENCARD, {
                contract: updated.contract,
                communitycard: updated.communitycard,
                opencard: Communitycard.cards
            });

            setTimeout(()=>{
                roundStartActions.nextUserTurnstart(updated);
            },1000)
            
        } else {
            logger.info("undefined  ", Communitycard)
        }
    }

    
}



