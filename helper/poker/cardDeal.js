const mongoose = require("mongoose")
const MongoID = mongoose.Types.ObjectId;

const fortuna = require('javascript-fortuna');
fortuna.init();
const CONST = require('../../constant');
const logger = require("../../logger");
const commandAcions = require("../socketFunctions");
const roundStartActions = require("./roundStart");
const PlayingTables = mongoose.model("playingTables");
const _ = require("underscore")
const cardLogic = require("./cardLogic");

module.exports.cardDealStart = async (tbid) => {
    logger.info("collectBoot tbid : ", tbid);
    let wh = {
        _id: tbid
    };
    let tb = await PlayingTables.findOne(wh, {}).lean();
    logger.info("collectBoot tb : ", tb);

    let cardDetails = this.getCards(tb.playerInfo);
    logger.info("collectBoot cardDetails : ", cardDetails);

    const update = {
        $set: {
            gameState: "CardDealing",
            deckCards: cardDetails.deckCards
        }
    }
    const cardDealIndexs = await this.setUserCards(cardDetails, tb);
    logger.info("initRoundState cardDealIndexs : ", cardDealIndexs);

    logger.info("initRoundState update : ", update);

    const tabInfo = await PlayingTables.findOneAndUpdate(wh, update, { new: true });
    logger.info("findTableAndJoin tabInfo : ", tabInfo);

    const eventResponse = {
        cardDealIndexs: cardDealIndexs,
        cardDetails: cardDetails,
        dealerSeatIndex: tabInfo.dealerSeatIndex,
        smallblindSeatIndex: tabInfo.smallblindSeatIndex,
        bigblindSeatIndex: tabInfo.bigblindSeatIndex,
        bigblind: bigblind,
        smallblind:smallblind
    }
    commandAcions.sendEventInTable(tabInfo._id.toString(), CONST.TABLE_CARD_DEAL, eventResponse);

    let tbId = tabInfo._id;
    let jobId = commandAcions.GetRandomString(10);
    let delay = commandAcions.AddTime(5);
    const delayRes = await commandAcions.setDelay(jobId, new Date(delay));

    await roundStartActions.roundStarted(tbId)
}

module.exports.setUserCards = async (cardsInfo, tb) => {
    try {
        logger.info("setUserCards cardsInfo : ", cardsInfo);
        logger.info("setUserCards tb : ", tb);

        const playerInfo = tb.playerInfo;
        let activePlayer = 0;
        let cardDealIndexs = [];

        for (let i = 0; i < playerInfo.length; i++)
            if (typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play") {

                let userInfo = {
                    si: playerInfo[i].seatIndex,
                    smallblind: (playerInfo[i].seatIndex == tb.smallblindSeatIndex) ? 1 : 0,
                    bigblind: (playerInfo[i].seatIndex == tb.bigblindSeatIndex) ? 1 : 0,
                    smallblindSeatIndex: tb.smallblindSeatIndex,
                    bigblindSeatIndex: tb.bigblindSeatIndex,
                    bet: (playerInfo[i].seatIndex == tb.smallblindSeatIndex) ? tb.smallblind : (playerInfo[i].seatIndex == tb.bigblindSeatIndex) ? tb.bigblind : 0,
                    check: 0,
                    allIn: 0,
                    fold: 0,
                    raise: 0,
                    type: "",
                    isturn: -1,
                    minbet: tb.minbet,
                    maxbet: tb.maxbet
                }

                let update = {
                    $set: {
                        "playerInfo.$.cards": cardsInfo.cards[activePlayer],
                    },
                    $push: {
                        contract: userInfo
                    }
                }


                let uWh = { _id: MongoID(tb._id.toString()), "playerInfo.seatIndex": Number(playerInfo[i].seatIndex) }
                logger.info("serUserCards uWh update ::", uWh, update)

                await PlayingTables.updateOne(uWh, update);

                // commandAcions.sendDirectEvent(playerInfo[i].sck, CONST.USER_CARD , { cards : cardsInfo.cards[activePlayer] }); 
                cardDealIndexs.push(Number(playerInfo[i].seatIndex))
                activePlayer++;
            }

        return cardDealIndexs;
    } catch (err) {
        logger.info("Exception setUserCards : 1 ::", err)
    }
}

module.exports.getCards = (playerInfo) => {
    let deckCards = Object.assign([], CONST.deckOne);

    //deckCards = deckCards.slice(0, deckCards.length);

    logger.info("getCards deckCards ::", deckCards);

    let cards = [];

    let color = ['H', 'S', 'D', 'C'];
    let number = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]




    // for (let i = 0; i < playerInfo.length; i++) {
    //     if (typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play" && playerInfo[i].isBot == true) {
    //         let card = [];

    //         console.log(playerInfo[i].isBot)

    //         card =  this.HighCard(deckCards,color,number)

    //         cards[playerInfo[i].seatIndex]= card;
    //     }
    // }

    for (let i = 0; i < playerInfo.length; i++) {
        if (typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].status == "play") {
            let card = [];

            console.log(playerInfo[i].isBot)


            //if (typeof playerInfo[i].seatIndex != "undefined" && playerInfo[i].isBot == false) {
            for (let i = 0; i < 2; i++) {
                let ran = parseInt(fortuna.random() * deckCards.length);
                card.push(deckCards[ran])
                deckCards.splice(ran, 1);
            }

            cards[playerInfo[i].seatIndex] = card;
            //}

        }
    }

    let ran = parseInt(fortuna.random() * deckCards.length);
    // let hukum = deckCards[ran];
    // deckCards.splice(ran, 1);

    //logger.info("getCards hukum ::", hukum);
    console.log("cards cards ", cards)
    return {
        cards: cards,
        deckCards: deckCards
    }
}


module.exports.getCards_communitycard = (cardNumber, tb) => {

    logger.info("getCards deckCards ::", tb.deckCards);

    let cards = [];


    for (let i = 0; i < cardNumber; i++) {
        let ran = parseInt(fortuna.random() * tb.deckCards.length);
        cards.push(tb.deckCards[ran])
        tb.deckCards.splice(ran, 1);
    }


    console.log("cards cards ", cards)
    console.log("cards deckCards ", tb.deckCards)

    return {
        cards: cards,
        deckCards: tb.deckCards
    }
}

module.exports.HighCard = (pack, color, card) => {

    var poss = [];
    var cardDealNumber = cardLogic.GetRandomInt(1, 3)

    if (cardDealNumber == 1) {
        // Teen 
        color = _.shuffle(color);
        var number = card[cardLogic.GetRandomInt(0, card.length - 1)]
        card.splice(card.indexOf(number), 1);


        for (var i = 0; i < 3; i++) {
            poss.push(color[i] + "-" + number + "-0");
        }

    } else if (cardDealNumber == 2) {
        // Normal Ron 

        var number = card[cardLogic.GetRandomInt(0, card.length - 3)]


        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            var c = color[cardLogic.GetRandomInt(0, color.length - 1)]

            poss.push(c + "-" + card[number] + "-0");
            number++;

        }

    } else if (cardDealNumber == 3) {
        // Color Ron 
        console.log("Same COLOR RON ", card)
        var c = color[cardLogic.GetRandomInt(0, color.length - 1)]

        var number = card[cardLogic.GetRandomInt(0, card.length - 3)]
        card.splice(card.indexOf(number), 3)

        console.log("Same COLOR RON card ", card)


        for (var i = 0; i < 3; i++) {

            poss.push(c + "-" + number + "-0");
            number++;

        }


    } else if (cardDealNumber == 4) {
        // Normal COLOR 
        var c = color[cardLogic.GetRandomInt(0, color.length - 1)]
        color.splice(color.indexOf(c), 1);

        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            var number = card[cardLogic.GetRandomInt(0, card.length - 1)]

            console.log("number ", number)
            console.log("card[number] ", card)
            poss.push(c + "-" + number + "-0");
            card.splice(card.indexOf(number), 1);
        }


        console.log("poss ", poss)

    } else {

        // pair 
        console.log("Pair ")
        var number = card[cardLogic.GetRandomInt(0, card.length - 3)]
        card.splice(card.indexOf(number), 1)

        for (var i = 0; i < 3; i++) {
            if (typeof card[number] == 'undefined')
                number = 0

            if (i == 2) {
                number = card[cardLogic.GetRandomInt(0, card.length - 3)]
                card.splice(card.indexOf(number), 1)
            }

            var c = color[cardLogic.GetRandomInt(0, color.length - 1)]
            color = _.difference(color, [c])

            poss.push(c + "-" + number + "-0");
        }

    }

    var finalcard = [];
    console.log("poss ", poss)
    for (var i = 0; i < poss.length; i++) {
        console.log("pack", pack)
        if (pack.indexOf(poss[i]) != -1) {
            finalcard.push(poss[i]);
            pack.splice(pack.indexOf(poss[i]), 1);
        }
    }

    console.log("finalcard  ", finalcard)
    return _.flatten(finalcard)

}