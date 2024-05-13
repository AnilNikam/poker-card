
const logger = require("../../logger");
const _ = require("underscore")

module.exports.getWinnerUser = (userInfo, communitycard, contract) => {
    let players = [];

    for (let i = 0; i < contract.length; i++) {
        if (contract[i].fold != 1) {

            let response = this.getWinState(userInfo[contract[i].si].cards, communitycard.splice(0, communitycard.length - 1));

            logger.info("getWinnerUser response : ", response);

            userInfo[contract[i].si].WinnerData = response

            players.push(userInfo[contract[i].si]);

            // response.seatIndex = userInfo[i].seatIndex;
            // players.push(response);

        }
    }

    logger.info("players :::::::::::::::::::::", players)

    totalbestWinnercomb.sort((e, f) => {
        return f.data.winvalue - e.data.winvalue
    })

    players = players.sort((a, b) => {
        return b.WinnerData.cardvalue  - a.WinnerData.cardvalue 
    }).sort((a, b) => {
        return a.WinnerData.winvalue - b.WinnerData.winvalue
    })

    // players = players.sort((a, b) => {
    //     return b.cardCount - a.cardCount
    // }).sort((a, b) => {
    //     return a.index - b.index
    // })
    logger.info("getWinnerUser players : ", players);

    return players
}

module.exports.getWinState = (userCards, communitycard) => {

    combinations = this.generateCombinations(userCards.contract(communitycard), 5);

    logger.info("combinations ", combinations)
    logger.info("combinations ", combinations.length)
    let totalbestWinnercomb = []
    for (let i = 0; i <= combinations.length - 1; i++) {
        winnerDeclare({ card: combinations[i], bet: 10 }, (e) => {

            if (e.data.iswin) {
                logger.info("return ::: ", e)
                totalbestWinnercomb.push(e)
            }
        })
    }

    logger.info("totalbestWinnercomb ", totalbestWinnercomb)

    totalbestWinnercomb.sort((e, f) => {
        return f.data.winvalue - e.data.winvalue
    })

    let sorthighcardalltype = []


    sorthighcardalltype = totalbestWinnercomb.filter((e) => {
        return e.data.wintype == totalbestWinnercomb[0].data.wintype
    })

    sorthighcardalltype.sort((e, f) => {
        return f.data.cardvalue - e.data.cardvalue
    })

    logger.info("sorthighcardalltype ", sorthighcardalltype)
    return sorthighcardalltype[0].data;

    // if (totalbestWinnercomb[0].data.wintype == "highcard") {

    //   totalbestWinnercomb.sort((e, f) => {
    //     return f.data.cardvalue - e.data.cardvalue
    //   })

    //   logger.info("totalbestWinnercomb :::", totalbestWinnercomb)

    //   return totalbestWinnercomb[0].data;
    // } else {
    //   return totalbestWinnercomb[0].data;
    // }


    // return {
    //     flag: true,
    //     cards: cards,
    //     cardCount: this.countCards(cards),
    //     status: "High_Cards",
    //     index: 6
    // }
}

module.exports.winnerDeclare = (data, callback) => {

    if (this.royalflush(data)) {

        let totalcard = 0

        for (var x in data.card) {
            totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
        }

        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: true,
                wintype: "royalflush",
                wingold: 0,
                wincardinx: data.card,
                oldcard: data.card,
                winvalue: 10,
                cardvalue: totalcard
            }
        }

        return callback(winobj)

    } else if (sf = this.straightflush(data)) {

        sf.data.oldcard = data.card
        sf.data.winvalue = 9
        return callback(sf)

    } else if (fok = this.fourofakind(data)) {
        fok.data.oldcard = data.card
        fok.data.winvalue = 8
        return callback(fok)

    } else if (foh = this.fullofhouse(data)) {
        foh.data.oldcard = data.card
        foh.data.winvalue = 7
        return callback(foh)

    } else if (fls = this.flush(data)) {
        fls.data.oldcard = data.card
        fls.data.winvalue = 6

        return callback(fls)

    } else if (strt = this.straight(data)) {
        strt.data.oldcard = data.card
        strt.data.winvalue = 5

        return callback(strt)

    } else if (tok = this.threeofakind(data)) {
        tok.data.oldcard = data.card
        tok.data.winvalue = 4

        return callback(tok)

    } else if (tp = this.twopair(data)) {
        tp.data.oldcard = data.card
        tp.data.winvalue = 3

        return callback(tp)

    } else if (pai = this.pair(data)) {
        pai.data.oldcard = data.card
        pai.data.winvalue = 1

        return callback(pai)

    } else if (jb = this.jacksorbetter(data)) {
        jb.data.oldcard = data.card
        jb.data.winvalue = 0

        return callback(jb)

    } else {
        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: false,
                wintype: "",
                wingold: 0,
                wincardinx: data.card,
                oldcard: data.card,
                winvalue: -1

            }
        }
        return callback(winobj)
    }
}

module.exports.generateCombinations = (cards, k) => {
    const combinations = [];

    function generate(prefix, remaining, k) {
        if (k === 0) {
            combinations.push(prefix);
            return;
        }

        for (let i = 0; i < remaining.length; i++) {
            const newPrefix = prefix.concat(remaining[i]);
            const newRemaining = remaining.slice(i + 1);
            generate(newPrefix, newRemaining, k - 1);
        }
    }

    generate([], cards, k);
    return combinations;
}

module.exports.DiffColor = (card) => {
    var obj = {
        cards: [],
        color: []
    };
    for (var i in card) {
        if (card[i] != null) {
            var d = card[i].split('-');
            obj.cards.push(parseInt(d[1]));
            obj.color.push(d[0]);
        }
    }
    return obj;
}

module.exports.royalflush = (data) => {
    var isroyalflush = true;


    for (var i = 0; i < data.card.length; i++) {
        if (parseInt(data.card[i].split("-")[1]) < 10 || data.card[i].split("-")[0] != data.card[0].split("-")[0]) {
            isroyalflush = false;
            break;
        }
    }

    return isroyalflush
}

module.exports.straightflush = (data) => {
    var a = DiffColor(data.card)
    var flag = true;
    a.cards.sort(module.exports.(e, f) {
        return e - f
    });

    if (flag == true) {
        for (var x in a.color) {
            if (a.color[x] != a.color[0]) {
                flag = false;
                break;
            }
        }
    }

    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }

    if (flag == true) {
        for (var i = 1; i < a.cards.length; i++) {
            if (a.cards[i] < 10 && a.cards[i] - a.cards[i - 1] == 1 || a.cards[i] - a.cards[i - 1] == -12) {
                flag = true;
                var winobj = {
                    "en": "DRAW",
                    "data": {
                        iswin: flag,
                        wintype: "straightflush",
                        wingold: 0,
                        wincardinx: data.card,
                        cardvalue: totalcard
                    }
                }

                return winobj
            } else {
                flag = false;
                break;
            }
        }
    }
}

module.exports.fourofakind = (data) => {
    var flag = false
    var temp1 = []
    var temp2 = []
    var temp3 = []
    var temp4 = []

    for (var x in data.card) {
        if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
            temp1.push(data.card[x])
        } else {
            temp2.push(data.card[x])
        }
    }

    var cnt = 0
    for (var x in temp1) {
        if (temp1[x].split("-")[1] == temp1[0].split("-")[1]) {
            cnt++
        }
    }


    var cnt1 = 0
    for (var x in temp2) {
        if (temp2[x].split("-")[1] == temp2[0].split("-")[1]) {
            temp4.push(temp2[x])
            cnt1++
        } else {
            temp3.push(temp2[x])
        }
    }

    var cnt2 = 0
    for (var x in temp3) {
        if (temp3[x].split("-")[1] == temp3[0].split("-")[1]) {
            cnt2++
        }
    }


    if (cnt == 4 && temp1.length == 4 || cnt == 3 && temp1.length == 3) {
        wincardinx = temp1
    } else if (cnt1 == 4 && temp4.length == 4 || cnt1 == 3 && temp4.length == 3) {
        wincardinx = temp4
    } else if (cnt2 == 3 && temp3.length == 3) {
        wincardinx = temp3
    }

    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }

    if (cnt == 4 || cnt1 == 4) {
        flag = true;
        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: flag,
                wintype: "fourofakind",
                wingold: 0,
                wincardinx: wincardinx,
                cardvalue: totalcard
            }
        }

        return winobj
    }

}

module.exports.fullofhouse = (data) => {
    var flag = false
    var temp1 = []
    var temp2 = []

    for (var x in data.card) {
        if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
            temp1.push(data.card[x])
        } else {
            temp2.push(data.card[x])
        }
    }

    var count = 0
    for (var x in temp2) {
        if (temp2[x].split("-")[1] == temp2[0].split("-")[1]) {
            count++
        }
    }

    var wincardinx = []
    if (count == 3 || count == 2) {

        wincardinx.push(temp1, temp2)
    }

    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }
    if ((temp1.length == 2 && count == 3) || (temp1.length == 3 && count == 2)) {
        flag = true
        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: flag,
                wintype: "fullofhouse",
                wingold: 0,
                wincardinx: wincardinx,
                cardvalue: totalcard
            }
        }

        return winobj
    }
}

module.exports.flush = (data) => {
    var a = DiffColor(data.card)
    var flag = true;
    a.cards.sort(module.exports.(e, f) {
        return e - f
    });

    if (flag == true) {
        for (var x in a.color) {
            if (a.color[x] != a.color[0]) {
                flag = false;
                break;
            }
        }
    }
    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }
    if (flag == true) {
        for (var i = 1; i < a.cards.length; i++) {

            if (a.cards[i] - a.cards[i - 1] != 1) {
                flag = true;
                var winobj = {
                    "en": "DRAW",
                    "data": {
                        iswin: flag,
                        wintype: "flush",
                        wingold: 0,
                        wincardinx: data.card,
                        cardvalue: totalcard
                    }
                }

                return winobj
            } else {
                flag = false;
                break;
            }
        }
    }
}

module.exports.straight = (data) => {

    var a = DiffColor(data.card)

    var flag = true;
    a.cards.sort(module.exports.(e, f) {
        return e - f
    });

    var count = 0;
    for (var x in a.color) {
        if (a.color[x] == a.color[0]) {
            count++;
        }
    }

    if (count >= 2) {

        return false
    }

    var count1 = 0
    for (var i = 1; i < a.cards.length; i++) {
        if (a.cards[i] - a.cards[i - 1] == 1 || a.cards[i] - a.cards[i - 1] == -12) {
            flag = true;
            count1++
        }
    }

    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }
    if (count1 == 4) {
        flag = true;
        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: flag,
                wintype: "straight",
                wingold: 0,
                wincardinx: data.card,
                cardvalue: totalcard
            }
        }

        return winobj
    }
}

module.exports.threeofakind = (data) => {
    var flag = false
    var temp1 = []
    var temp2 = []
    var temp3 = []
    var temp4 = []

    for (var x in data.card) {
        if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
            temp1.push(data.card[x])
        } else {
            temp2.push(data.card[x])
        }
    }

    var cnt = 0
    for (var x in temp1) {
        if (temp1[x].split("-")[1] == temp1[0].split("-")[1]) {
            cnt++
        }
    }


    var cnt1 = 0
    for (var x in temp2) {
        if (temp2[x].split("-")[1] == temp2[0].split("-")[1]) {
            temp4.push(temp2[x])
            cnt1++
        } else {
            temp3.push(temp2[x])
        }
    }


    var cnt2 = 0
    for (var x in temp3) {
        if (temp3[x].split("-")[1] == temp3[0].split("-")[1]) {
            cnt2++
        }
    }


    if (cnt == 4 && temp1.length == 4 || cnt == 3 && temp1.length == 3) {
        wincardinx = temp1
    } else if (cnt1 == 4 && temp4.length == 4 || cnt1 == 3 && temp4.length == 3) {
        wincardinx = temp4
    } else if (cnt2 == 3 && temp3.length == 3) {
        wincardinx = temp3
    }

    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }
    // if(cnt == 4 || cnt1 == 4){
    //     flag = true;
    //     var winobj = { 
    //			"en": "DRAW",
    //          "data": {
    //         		iswin: flag, 
    //         		wintype: "fourofakind", 
    //         		wingold: 0, 
    //         		wincardinx: wincardinx
    //			}
    //     }
    //     logger.info("winobj :::::::::::::", winobj)
    //     return winobj
    // }

    if (cnt == 3 || cnt1 == 3 || (cnt2 == 3 && temp3.length)) {
        flag = true;
        //cdClass.updateUserGold(client.uid, data.betAmt * 3)
        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: flag,
                wintype: "threeofakind",
                wingold: 0,
                wincardinx: wincardinx,
                cardvalue: totalcard
            }
        }

        return winobj
    }
}

module.exports.twopair = (data) => {
    var flag = false
    var temp1 = []
    var temp2 = []
    var temp3 = []
    var temp4 = []

    for (var x in data.card) {
        if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
            temp1.push(data.card[x])
        } else {
            temp2.push(data.card[x])
        }
    }

    var cnt = 0
    for (var x in temp1) {
        if (temp1[x].split("-")[1] == temp1[0].split("-")[1]) {
            cnt++
        }
    }
    var cnt1 = 0
    for (var x in temp2) {
        if (temp2[x].split("-")[1] == temp2[0].split("-")[1]) {
            temp3.push(temp2[x])
            cnt1++
        } else {
            temp4.push(temp2[x])
        }
    }


    var cnt2 = 0
    for (var x in temp3) {
        if (temp3[x].split("-")[1] == temp3[0].split("-")[1]) {
            cnt2++
        }
    }

    var cnt3 = 0
    for (var x in temp4) {
        if (temp4[x].split("-")[1] == temp4[0].split("-")[1]) {
            cnt3++
        }
    }

    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }

    var wincardinx = []
    if (cnt == 2 && temp1.length == 2 && cnt1 == 2 && temp2.length == 2) {
        wincardinx.push(temp1, temp2)
    } else if (cnt1 == 2 && temp2.length == 2 && cnt2 == 2 && temp3.length == 2) {
        wincardinx.push(temp2, temp3)
    } else if (cnt2 == 2 && temp3.length == 2 && cnt == 2 && temp1.length == 2) {
        wincardinx.push(temp3, temp1)
    } else if (cnt == 2 && temp1.length == 2 && cnt3 == 2 && temp4.length == 2) {
        wincardinx.push(temp1, temp4)
    } else if (cnt2 == 2 && temp3.length == 2 && cnt3 == 2 && temp4.length == 2) {
        wincardinx.push(temp3, temp4)
    } else {
        return false
    }

    if (cnt == 2 && cnt1 == 2 || cnt1 == 2 && cnt2 == 2 || cnt2 == 2 && cnt == 2 || cnt == 2 && cnt3 == 2) {
        flag = true
        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: flag,
                wintype: "twopair",
                wingold: 0,
                wincardinx: wincardinx,
                cardvalue: totalcard
            }
        }

        return winobj
    }
}

module.exports.pair = (data) => {
    var flag = false
    var temp1 = []
    var temp2 = []

    for (var x in data.card) {
        if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
            temp1.push(data.card[x])
        } else {
            temp2.push(data.card[x])
        }
    }

    var cnt = 0
    for (var x in temp1) {
        if (temp1[x].split("-")[1] == temp1[0].split("-")[1]) {
            cnt++
        }
    }

    let totalcard = 0

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }


    var wincardinx = []
    if (cnt == 2 && temp1.length == 2) {
        wincardinx.push(temp1)
    } else {
        return false
    }

    if (cnt == 2) {
        flag = true
        var winobj = {
            "en": "DRAW",
            "data": {
                iswin: flag,
                wintype: "pair",
                wingold: 0,
                wincardinx: wincardinx,
                cardvalue: totalcard
            }
        }

        return winobj
    }
}

module.exports.jacksorbetter = (data) => {

    let totalcard = 0;

    for (var x in data.card) {
        totalcard = totalcard + (parseInt(data.card[x].split("-")[1]) == 1 ? 14 : parseInt(data.card[x].split("-")[1]))
    }

    var winobj = {
        "en": "DRAW",
        "data": {
            iswin: true,
            wintype: "highcard",
            wingold: 0,
            wincardinx: data.card,
            cardvalue: totalcard
        }
    }

    return winobj

}