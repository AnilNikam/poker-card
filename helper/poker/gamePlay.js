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


/*
        TAKEACTION Contract
        Data:{
            type : "", "call" || raise || All In
            bet:10
        }

        TAKEACTION  same and  round finish 

    */
module.exports.TAKEACTION = async (requestData, client) => {

    if (typeof client.tbid == 'undefined' || Data.type == undefined || Data.bet == undefined ) {
        commandAcions.sendDirectEvent(client.sck, CONST.TAC, requestData, false, "User session not set, please restart game!");
        return false;
    }
    if (typeof client.TAC != "undefined" && client.TAC) {

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
        commandAcions.sendDirectEvent(client.sck, CONST.TAC, requestData, false, "Turn is already taken!");
        return false;
    }
    if (tabInfo.turnSeatIndex != client.seatIndex) {
        logger.info("chal : client.su ::", client.seatIndex);
        delete client.TAC;
        commandAcions.sendDirectEvent(client.sck, CONST.TAC, requestData, false, "It's not your turn!");
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
    if (tabInfo.contract.length > 0) {
        //_.map(tabInfo.contract, function (el) { return el.islastcontract = false; });
        var foundIndex = tabInfo.contract.findIndex(x => x.si == client.si);
    } else {
        var foundIndex = -1
    }
    if (foundIndex != -1) {
        tabInfo.contract[foundIndex].bet = requestData.bet
        tabInfo.contract[foundIndex].type = requestData.type

        Set["$set"]["contract"] = tabInfo.contract;
        Set["$set"]["pi." + client.si + ".turnMissCounter"] = 0;
    } else {
       console.log("ddddddddddddddddddddddddddddddddddd ELSE KKKKKKKKKKKKK")
        // var jdt = {
        //     "suit": data.suit,
        //     "contract": data.contract,
        //     "status": "TAKE",
        //     "uid": tabInfo.pi[client.si].ui.uid,
        //     "si": parseInt(client.si),
        //     "islastcontract": true
        // }
        // tabInfo.contract.push(jdt)
        // Set["$set"]["contract"] = tabInfo.contract;
        // Set["$set"]["pi." + client.si + ".turn_miss_cont"] = 0;
    }

    var WH = { _id: MongoId(client.tbid.toString()) };


    const updated = await PlayingTables.findOneAndUpdate(WH, Set, { new: true });
    logger.info("chal tb : ", tb);


    if (updated == null) {
        trackClass.trackingplayingerror(client, 'TAC', { data: requestData, tb: updated }, 'error:TAC003');
        return false;
    }
    

    commandAcions.clearJob(tabInfo.job_id);
    commandAcions.sendEventInTable(updated._id.toString(), CONST.TAC, {
        contract: updated.contract,
        type: requestData.type,
        bet: requestData.bet,
        si: client.si
    });

    //All User Bet same and Check After Round Change 
    // Check also same bet and 

    let allusersamebet =  updated.contract.filter((e)=>{
       return e.bet == requestData.bet || e.fold == 1
    })

    console.log("allusersamebet ",allusersamebet)
    
    if(allusersamebet.length == updated.contract.length){
        
        //Round change 
    }else{

    }


    // If not same after start again 
 
}

module.exports.chal = async (requestData, client) => {
    try {
        logger.info("chal requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.CHAL, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.chal != "undefined" && client.chal) return false;

        client.chal = true;

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info("chal tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("chal user not turn ::", tabInfo);
            delete client.chal;
            return false
        }
        if (tabInfo.turnDone) {
            logger.info("chal : client.su ::", client.seatIndex);
            delete client.chal;
            commandAcions.sendDirectEvent(client.sck, CONST.CHAL, requestData, false, "Turn is already taken!");
            return false;
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info("chal : client.su ::", client.seatIndex);
            delete client.chal;
            commandAcions.sendDirectEvent(client.sck, CONST.CHAL, requestData, false, "It's not your turn!");
            return false;
        }

        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        let currentBet = Number(tabInfo.chalValue);
        logger.info("chal currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("chal UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {

            },
            $inc: {

            }
        }
        let chalvalue = tabInfo.chalValue;

        if (typeof requestData.isIncrement != "undefined" && requestData.isIncrement) {
            chalvalue = chalvalue * 2;
        }

        if (playerInfo.playStatus == "blind" && playerInfo.isSee) {
            chalvalue = chalvalue * 2;
            updateData.$set["playerInfo.$.playStatus"] = "chal"
        }
        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)

        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("chal client.su ::", client.seatIndex);
            delete client.chal;
            commandAcions.sendDirectEvent(client.sck, CONST.CHAL, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2))

        await walletActions.deductWallet(client.uid, -chalvalue, 2, "poker chal", tabInfo, client.id, client.seatIndex);

        updateData.$set["chalValue"] = chalvalue;
        updateData.$inc["potValue"] = chalvalue;

        updateData.$set["turnDone"] = true;
        commandAcions.clearJob(tabInfo.job_id);

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("chal upWh updateData :: ", upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("chal tb : ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            chalValue: chalvalue,
            potValue: tb.potValue
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.CHAL, response);
        delete client.chal;
        if (Number(tb.potLimit) <= Number(tb.potValue)) {
            await checkWinnerActions.autoShow(tb);
        } else {
            let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
            logger.info("chal activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
            if (activePlayerInRound.length == 1) {
                await gameFinishActions.lastUserWinnerDeclareCall(tb);
            } else {
                await roundStartActions.nextUserTurnstart(tb);
            }
        }
        return true;
    } catch (e) {
        logger.info("Exception chal : ", e);
    }
}

module.exports.show = async (requestData, client) => {
    try {
        logger.info("show requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.show != "undefined" && client.show) return false;

        client.show = true;

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info("show tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("show user not turn ::", tabInfo);
            delete client.show;
            return false
        }
        if (tabInfo.turnDone) {
            logger.info("chal : client.su ::", client.seatIndex);
            delete client.chal;
            commandAcions.sendDirectEvent(client.sck, CONST.CHAL, requestData, false, "Turn is already taken!");
            return false;
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info("show : client.su ::", client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "It's not your turn!");
            return false;
        }

        const playerInGame = await roundStartActions.getPlayingUserInRound(tabInfo.playerInfo);
        logger.info("show userTurnExpaire playerInGame ::", playerInGame);

        if (playerInGame.length != 2) {
            logger.info("show : client.su ::", client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "Not valid show!!");
            return false;
        }

        let playerInfo = tabInfo.playerInfo[client.seatIndex];
        logger.info("show playerInfo ::", playerInfo);

        let currentBet = Number(tabInfo.chalValue);
        logger.info("show currentBet ::", currentBet);

        let gwh = {
            _id: MongoID(client.uid)
        }
        let UserInfo = await GameUser.findOne(gwh, {}).lean();
        logger.info("show UserInfo : ", gwh, JSON.stringify(UserInfo));

        let updateData = {
            $set: {
            },
            $inc: {

            }
        }
        let chalvalue = tabInfo.chalValue;

        if (typeof requestData.isIncrement != "undefined" && requestData.isIncrement) {
            chalvalue = chalvalue * 2;
        }
        let totalWallet = Number(UserInfo.chips) + Number(UserInfo.winningChips)
        if (Number(chalvalue) > Number(totalWallet)) {
            logger.info("show client.su :: ", client.seatIndex);
            delete client.show;
            commandAcions.sendDirectEvent(client.sck, CONST.SHOW, requestData, false, "Please add wallet!!");
            return false;
        }
        chalvalue = Number(Number(chalvalue).toFixed(2));

        await walletActions.deductWallet(client.uid, -chalvalue, 3, "poker show", tabInfo, client.id, client.seatIndex);

        updateData.$set["chalValue"] = chalvalue;
        updateData.$inc["potValue"] = chalvalue;

        commandAcions.clearJob(tabInfo.job_id);
        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        logger.info("show upWh updateData :: ", upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("show tb :: ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
            chalValue: chalvalue
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.SHOW, response);
        delete client.show;
        await checkWinnerActions.winnercall(tb, true, tb.turnSeatIndex);
        return true;
    } catch (e) {
        logger.info("Exception chal : ", e);
    }
}

module.exports.cardPack = async (requestData, client) => {
    try {
        logger.info("PACK requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.PACK, requestData, false, "User session not set, please restart game!");
            return false;
        }
        if (typeof client.pack != "undefined" && client.pack) return false;

        client.pack = true;

        const wh = {
            _id: MongoID(client.tbid.toString())
        }
        const project = {

        }
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info("PACK tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("PACK user not turn ::", tabInfo);
            delete client.pack;
            return false
        }
        if (tabInfo.turnSeatIndex != client.seatIndex) {
            logger.info("PACK : client.su ::", client.seatIndex);
            delete client.pack;
            commandAcions.sendDirectEvent(client.sck, CONST.PACK, requestData, false, "It's not your turn!", "Error!");
            return false;
        }
        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        commandAcions.clearJob(tabInfo.job_id);
        let winner_state = checkUserCardActions.getWinState(playerInfo.cards, tabInfo.hukum);
        let userTrack = {
            _id: playerInfo._id,
            username: playerInfo.username,
            cards: playerInfo.cards,
            seatIndex: client.seatIndex,
            total_bet: playerInfo.totalBet,
            play_status: "pack",
            winning_card_status: winner_state.status
        }

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        const updateData = {
            $set: {
                "playerInfo.$.status": "pack",
                "playerInfo.$.playerStatus": "pack"
            },
            $push: {
                gameTracks: userTrack
            }
        };
        logger.info("PACK upWh updateData :: ", upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("PACK tb : ", tb);

        let response = {
            seatIndex: tb.turnSeatIndex,
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.PACK, response);

        let activePlayerInRound = await roundStartActions.getPlayingUserInRound(tb.playerInfo);
        logger.info("PACK activePlayerInRound :", activePlayerInRound, activePlayerInRound.length);
        if (activePlayerInRound.length == 1) {
            await gameFinishActions.lastUserWinnerDeclareCall(tb);
        } else {
            await roundStartActions.nextUserTurnstart(tb);
        }
        return true;
    } catch (e) {
        logger.info("Exception PACK : ", e);
    }
}

module.exports.seeCard = async (requestData, client) => {
    try {
        logger.info("seeCard requestData : ", requestData);
        if (typeof client.tbid == "undefined" || typeof client.uid == "undefined" || typeof client.seatIndex == "undefined") {
            commandAcions.sendDirectEvent(client.sck, CONST.SEE_CARD, requestData, false, "1000", "User session not set, please restart game!", "Error!");
            return false;
        }
        const wh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        const project = {
        }
        const tabInfo = await PlayingTables.findOne(wh, project).lean();
        logger.info("seeCard tabInfo : ", tabInfo);

        if (tabInfo == null) {
            logger.info("seeCard user not turn ::", tabInfo);
            return false
        }
        let playerInfo = tabInfo.playerInfo[client.seatIndex];

        const upWh = {
            _id: MongoID(client.tbid.toString()),
            "playerInfo.seatIndex": Number(client.seatIndex)
        }
        const updateData = {
            $set: {
                "playerInfo.$.isSee": true
            }
        };
        logger.info("seeCard upWh updateData :: ", upWh, updateData);

        const tb = await PlayingTables.findOneAndUpdate(upWh, updateData, { new: true });
        logger.info("seeCard tb : ", tb);

        let response = {
            cards: playerInfo.cards
        }
        commandAcions.sendEvent(client, CONST.SEE_CARD_INFO, response);
        let isShow = await roundStartActions.checShowButton(tb.playerInfo, client.seatIndex);

        let response1 = {
            seatIndex: client.seatIndex,
            isShow: isShow
        }
        commandAcions.sendEventInTable(tb._id.toString(), CONST.SEE_CARD, response1);

        return true;
    } catch (e) {
        logger.info("Exception PACK : ", e);
    }
}