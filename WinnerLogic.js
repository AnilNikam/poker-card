
deckOne = [
  'H-1', 'H-2', 'H-3', 'H-4', 'H-5', 'H-6', 'H-7', 'H-8', 'H-9', 'H-10', 'H-11', 'H-12', 'H-13',
  'S-1', 'S-2', 'S-3', 'S-4', 'S-5', 'S-6', 'S-7', 'S-8', 'S-9', 'S-10', 'S-11', 'S-12', 'S-13',
  'D-1', 'D-2', 'D-3', 'D-4', 'D-5', 'D-6', 'D-7', 'D-8', 'D-9', 'D-10', 'D-11', 'D-12', 'D-13',
  'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'C-7', 'C-8', 'C-9', 'C-10', 'C-11', 'C-12', 'C-13'
]


console.log("::::::::::::::::::::::::: Winner ", checkwinner(["H-1", "C-5", "D-5", "H-3", "D-3", "D-11", "S-12"]))


function generateCombinations(cards, k) {
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


function winnerDeclare(data, callback) {

  if (royalflush(data)) {

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

  } else if (sf = straightflush(data)) {

    sf.data.oldcard = data.card
    sf.data.winvalue = 9
    return callback(sf)

  } else if (fok = fourofakind(data)) {
    fok.data.oldcard = data.card
    fok.data.winvalue = 8
    return callback(fok)

  } else if (foh = fullofhouse(data)) {
    foh.data.oldcard = data.card
    foh.data.winvalue = 7
    return callback(foh)

  } else if (fls = flush(data)) {
    fls.data.oldcard = data.card
    fls.data.winvalue = 6

    return callback(fls)

  } else if (strt = straight(data)) {
    strt.data.oldcard = data.card
    strt.data.winvalue = 5

    return callback(strt)

  } else if (tok = threeofakind(data)) {
    tok.data.oldcard = data.card
    tok.data.winvalue = 4

    return callback(tok)

  } else if (tp = twopair(data)) {
    tp.data.oldcard = data.card
    tp.data.winvalue = 3

    return callback(tp)

  } else if (pai = pair(data)) {
    pai.data.oldcard = data.card
    pai.data.winvalue = 1

    return callback(pai)

  } else if (jb = jacksorbetter(data)) {
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

function DiffColor(card) {
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

function royalflush(data) {
  var isroyalflush = true;


  for (var i = 0; i < data.card.length; i++) {
    if (parseInt(data.card[i].split("-")[1]) < 10 || data.card[i].split("-")[0] != data.card[0].split("-")[0]) {
      isroyalflush = false;
      break;
    }
  }

  return isroyalflush
}

function straightflush(data) {
  var a = DiffColor(data.card)
  var flag = true;
  a.cards.sort(function (e, f) {
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

function fourofakind(data) {
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

function fullofhouse(data) {
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

function flush(data) {
  var a = DiffColor(data.card)
  var flag = true;
  a.cards.sort(function (e, f) {
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

function straight(data) {

  var a = DiffColor(data.card)

  var flag = true;
  a.cards.sort(function (e, f) {
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

function threeofakind(data) {
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
  //     console.log("winobj :::::::::::::", winobj)
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

function twopair(data) {
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

function pair(data) {
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

function jacksorbetter(data) {

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


function checkwinner(totalcard) {

  //7 card possibility 
  //5 card 

  combinations = generateCombinations(totalcard, 5);

  console.log("combinations ", combinations)
  console.log("combinations ", combinations.length)
  let totalbestWinnercomb = []
  for (let i = 0; i <= combinations.length - 1; i++) {
    winnerDeclare({ card: combinations[i], bet: 10 }, (e) => {

      if (e.data.iswin) {
        console.log("return ::: ", e)
        totalbestWinnercomb.push(e)
      }
    })
  }

  console.log("totalbestWinnercomb ", totalbestWinnercomb)

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

  console.log("sorthighcardalltype ",sorthighcardalltype)
  return sorthighcardalltype[0].data;

  // if (totalbestWinnercomb[0].data.wintype == "highcard") {

  //   totalbestWinnercomb.sort((e, f) => {
  //     return f.data.cardvalue - e.data.cardvalue
  //   })

  //   console.log("totalbestWinnercomb :::", totalbestWinnercomb)

  //   return totalbestWinnercomb[0].data;
  // } else {
  //   return totalbestWinnercomb[0].data;
  // }

}