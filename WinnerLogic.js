
deckOne =  [
    'H-1', 'H-2', 'H-3', 'H-4', 'H-5', 'H-6', 'H-7', 'H-8', 'H-9', 'H-10', 'H-11', 'H-12', 'H-13',
    'S-1', 'S-2', 'S-3', 'S-4', 'S-5', 'S-6', 'S-7', 'S-8', 'S-9', 'S-10', 'S-11', 'S-12', 'S-13',
    'D-1', 'D-2', 'D-3', 'D-4', 'D-5', 'D-6', 'D-7', 'D-8', 'D-9', 'D-10', 'D-11', 'D-12', 'D-13',
    'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'C-7', 'C-8', 'C-9', 'C-10', 'C-11', 'C-12', 'C-13'
  ]


checkwinner(["H-1","C-2","D-2","H-3","H-4","D-1","S-1"])

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


function winnerDeclare (data, callback) {
  if(VideoPokerClass.royalflush(data)){
    var winobj = {
      "en": "DRAW",
      "data": {
        iswin: true, 
        wintype: "royalflush", 
        wingold: data.betAmt * 800, 
        wincardinx: data.card
      }
    }
    
    return callback(winobj)

  }else if(sf = VideoPokerClass.straightflush(data)){
    
    
    return callback(sf)

  }else if(fok = VideoPokerClass.fourofakind(data)){
    
    return callback(fok)

  }else if(foh = VideoPokerClass.fullofhouse(data)){

    return callback(foh)
    
  }else if(fls = VideoPokerClass.flush(data)){

    return callback(fls)

  }else if(strt = VideoPokerClass.straight(data)){

    return callback(strt)

  }else if(tok = VideoPokerClass.threeofakind(data)){

    return callback(tok)

  }else if(tp = VideoPokerClass.twopair(data)){

    return callback(tp)

  }else if(jb = VideoPokerClass.jacksorbetter(data)){

    return callback(jb)

  }else{
    var winobj = {
      "en": "DRAW",
      "data": { 
        iswin: false, 
        wintype: "", 
        wingold: 0, 
        wincardinx: data.card
      }
    }
    return callback(winobj)
  }
}

function DiffColor(card, callback) {
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
  return callback(obj);
}

function royalflush (data) {
  var isroyalflush = true;
  for(var i = 0; i < data.card.length; i++){
    if(parseInt(data.card[i].split("-")[1]) < 10 || data.card[i].split("-")[0] != data.card[0].split("-")[0]){
      isroyalflush = false;
      break;
    }
  }
  
  return isroyalflush
}

function straightflush (data) {
  var a = VideoPokerClass.DiffColor(data.card)
  var flag = true;
  a.cards.sort(function(e, f) {
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

  if (flag == true) {
    for(var i = 1; i < a.cards.length; i++) {
      if (a.cards[i] < 10 && a.cards[i] - a.cards[i - 1] == 1 || a.cards[i] - a.cards[i - 1] == -12) {
        flag = true;
        var winobj = {
          "en": "DRAW",
          "data": {
            iswin: flag, 
            wintype: "straightflush", 
            wingold: data.betAmt * 50, 
            wincardinx: data.card
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

function fourofakind (data) {
  var flag = false
  var temp1 = []
  var temp2 = []
  var temp3 = []
  var temp4 = []

  for (var x in data.card) {
    if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
      temp1.push(data.card[x])
    }else{
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
    }else{
      temp3.push(temp2[x])
    }
  }
  
  var cnt2 = 0
  for (var x in temp3) {
    if (temp3[x].split("-")[1] == temp3[0].split("-")[1]) {
      cnt2++
    }
  }
  

  if(cnt == 4 && temp1.length ==  4 || cnt == 3 && temp1.length == 3){
    wincardinx = temp1
  }else if (cnt1 == 4 && temp4.length == 4 || cnt1 == 3 && temp4.length == 3){
    wincardinx = temp4
  }else if(cnt2 == 3 && temp3.length == 3){
    wincardinx = temp3
  }

  if(cnt == 4 || cnt1 == 4){
    flag = true;
    var winobj = {
      "en": "DRAW",
      "data": {
        iswin: flag, 
        wintype: "fourofakind", 
        wingold: data.betAmt * 25, 
        wincardinx: wincardinx
      }
    }
    
    return winobj
  }

}

function fullofhouse (data) {
  var flag = false
  var temp1 = []
  var temp2 = []

  for (var x in data.card) {
    if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
      temp1.push(data.card[x])
    }else{
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
  if(count == 3 || count == 2){
    
    wincardinx.push(temp1, temp2)
  }
  
  if((temp1.length == 2 && count == 3) || (temp1.length == 3 && count == 2)){
    flag = true
    var winobj = {
      "en": "DRAW",
            "data": { 
        iswin: flag, 
        wintype: "fullofhouse", 
        wingold: data.betAmt * 9,
        wincardinx: wincardinx
      }
    }
    
    return winobj
  }
}

function flush (data) {
  var a = VideoPokerClass.DiffColor(data.card)
  var flag = true;
  a.cards.sort(function(e, f) {
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

  if (flag == true) {
    for(var i = 1; i < a.cards.length; i++) {
      
      if (a.cards[i] - a.cards[i - 1] != 1) {
        flag = true;
        var winobj = { 
          "en": "DRAW",
                "data": {
            iswin: flag, 
            wintype: "flush", 
            wingold: data.betAmt * 6, 
            wincardinx: data.card
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

function straight (data)  {
  
    var a = VideoPokerClass.DiffColor(data.card)

      var flag = true;
      a.cards.sort(function(e, f) {
          return e - f
      });

      var count = 0;
      for (var x in a.color) {
          if (a.color[x] == a.color[0]) {
              count++;
          }
      } 
      
      if(count >= 2){
          
          return false
      }

      var count1 = 0
      for(var i = 1; i < a.cards.length; i++) {
          if (a.cards[i] - a.cards[i - 1] == 1 || a.cards[i] - a.cards[i - 1] == -12) {
              flag = true;
              count1++
          }
      }
     

      if (count1 == 4) {
          flag = true;
          var winobj = { 
      "en": "DRAW",
            "data": {
        iswin: flag, 
        wintype: "straight", 
        wingold: data.betAmt * 4, 
        wincardinx: data.card
      }
          }
          
          return winobj
      } 
}

function threeofakind (data) {
  var flag = false
  var temp1 = []
  var temp2 = []
  var temp3 = []
  var temp4 = []

  for (var x in data.card) {
    if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
      temp1.push(data.card[x])
    }else{
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
    }else{
      temp3.push(temp2[x])
    }
  }
  

  var cnt2 = 0
  for (var x in temp3) {
    if (temp3[x].split("-")[1] == temp3[0].split("-")[1]) {
      cnt2++
    }
  }
  

  if(cnt == 4 && temp1.length ==  4 || cnt == 3 && temp1.length == 3){
    wincardinx = temp1
  }else if (cnt1 == 4 && temp4.length == 4 || cnt1 == 3 && temp4.length == 3){
    wincardinx = temp4
  }else if(cnt2 == 3 && temp3.length == 3){
    wincardinx = temp3
  }

  // if(cnt == 4 || cnt1 == 4){
  //     flag = true;
  //     var winobj = { 
  //			"en": "DRAW",
  //          "data": {
  //         		iswin: flag, 
  //         		wintype: "fourofakind", 
  //         		wingold: data.betAmt * 25, 
  //         		wincardinx: wincardinx
  //			}
  //     }
  //     console.log("winobj :::::::::::::", winobj)
  //     return winobj
  // }
  
  if(cnt == 3 || cnt1 == 3 || (cnt2 == 3 && temp3.length)){
    flag = true;
    cdClass.updateUserGold(client.uid, data.betAmt * 3)
    var winobj = { 
      "en": "DRAW",
            "data": {
        iswin: flag, 
        wintype: "threeofakind", 
        wingold: data.betAmt * 3, 
        wincardinx: wincardinx
      }
    }
    
    return winobj
  }
}

function twopair (data) {
  var flag = false
  var temp1 = []
  var temp2 = []
  var temp3 = []
  var temp4 = []

  for (var x in data.card) {
    if (data.card[x].split("-")[1] == data.card[0].split("-")[1]) {
      temp1.push(data.card[x])
    }else{
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
    }else{
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
  

  var wincardinx = []
  if(cnt == 2 && temp1.length == 2 && cnt1 == 2 && temp2.length == 2){
    wincardinx.push(temp1, temp2)
  }else if(cnt1 == 2 && temp2.length == 2 && cnt2 == 2 && temp3.length == 2){
    wincardinx.push(temp2, temp3)
  }else if(cnt2 == 2 && temp3.length == 2 && cnt == 2 && temp1.length == 2){
    wincardinx.push(temp3, temp1)
  }else if(cnt == 2 && temp1.length == 2 && cnt3 == 2 && temp4.length == 2){
    wincardinx.push(temp1, temp4)
  }else if(cnt2 == 2 && temp3.length == 2 && cnt3 == 2 && temp4.length == 2){
    wincardinx.push(temp3, temp4)
  }else{
    return false
  }

  if(cnt == 2 && cnt1 == 2 || cnt1 == 2 && cnt2 == 2 || cnt2 == 2 && cnt == 2 || cnt == 2 && cnt3 == 2){
    flag = true
    var winobj = { 
      "en": "DRAW",
            "data": {
        iswin: flag, 
        wintype: "twopair", 
        wingold: data.betAmt * 2, 
        wincardinx: wincardinx
      }
    }
    
    return winobj
  }
}

function jacksorbetter (data)  {
  var flag = false
  var temp1 = []
  var temp2 = []
  var temp3 = []
  var temp4 = []
  var temp5 = []

  for (var x in data.card) {
    if (data.card[x].split("-")[1] == 14) {
      temp1.push(data.card[x])
    }else if (data.card[x].split("-")[1] == 13) {
      temp2.push(data.card[x])
    }else if (data.card[x].split("-")[1] == 12) {
      temp3.push(data.card[x])
    }else if (data.card[x].split("-")[1] == 11) {
      temp4.push(data.card[x])
    }else{
      temp5.push(data.card[x])
    }
  }
  
  var count = 0
  for (var x in temp5) {
    if (temp5[x].split("-")[1] == temp5[0].split("-")[1]) {
      count++
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
      cnt1++
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
  
  if(cnt == 2 && count == 2 || cnt1 == 2 && count == 2 || cnt2 == 2 && count == 2 || cnt3 == 2 && count == 2){
    return flag
  }

  
  if((cnt == 2 && temp1.length == 2 && temp2.length == 0 && temp3.length == 0 && temp4.length == 0) ||
  (count == 1 && cnt == 2 && cnt1 == 0 && cnt2 == 0 && cnt3 == 1 && temp1.length == 2) ||
  (count == 1 && cnt == 2 && cnt1 == 0 && cnt2 == 1 && cnt3 == 1 && temp1.length == 2) ||
  (count == 1 && cnt == 2 && cnt1 == 1 && cnt2 == 0 && cnt3 == 0 && temp1.length == 2)){
    wincardinx = temp1
  }else if((cnt1 == 2 && temp1.length == 0 && temp2.length == 2 && temp3.length == 0 && temp4.length == 0) ||
  (count == 1 && cnt == 1 && cnt1 == 2 && cnt2 == 0 && cnt3 == 0 && temp2.length == 2) ||
  (count == 1 && cnt == 0 && cnt1 == 2 && cnt2 == 0 && cnt3 == 1 && temp2.length == 2) ||
  (count == 1 && cnt == 1 && cnt1 == 2 && cnt2 == 0 && cnt3 == 1 && temp2.length == 2) ||
  (count == 1 && cnt == 1 && cnt1 == 2 && cnt2 == 1 && cnt3 == 0 && temp2.length == 2)){
    wincardinx = temp2
  }else if((cnt2 == 2 && temp1.length == 0 && temp2.length == 0 && temp3.length == 2 && temp4.length == 0) ||
  (count == 1 && cnt == 0 && cnt1 == 0 && cnt2 == 2 && cnt3 == 1 && temp3.length == 2) ||
  (count == 1 && cnt == 1 && cnt1 == 0 && cnt2 == 2 && cnt3 == 1 && temp3.length == 2) ||
  (count == 1 && cnt == 1 && cnt1 == 1 && cnt2 == 2 && cnt3 == 0 && temp3.length == 2)){
    wincardinx = temp3
  }else if((cnt3 == 2 && temp1.length == 0 && temp2.length == 0 && temp3.length == 0 && temp4.length == 2) ||
  (count == 1 && cnt == 0 && cnt1 == 0 && cnt2 == 1 && cnt3 == 2 && temp4.length == 2) ||
  (count == 1 && cnt == 1 && cnt1 == 0 && cnt2 == 1 && cnt3 == 2 && temp4.length == 2) ||
  (count == 1 && cnt == 1 && cnt1 == 1 && cnt2 == 0 && cnt3 == 2 && temp4.length == 2) ||
  (cnt == 1 && cnt1 == 0 && cnt2 == 0 && cnt3 == 2 && temp4.length == 2) ||
  (cnt == 0 && cnt1 == 1 && cnt2 == 0 && cnt3 == 2 && temp4.length == 2)){
    wincardinx = temp4
  }

    if((cnt == 2 && temp1.length == 2 && temp2.length == 0 && temp3.length == 0 && temp4.length == 0) || 
    (cnt1 == 2 && temp1.length == 0 && temp2.length == 2 && temp3.length == 0 && temp4.length == 0) || 
    (cnt2 == 2 && temp1.length == 0 && temp2.length == 0 && temp3.length == 2 && temp4.length == 0) || 
    (cnt3 == 2 && temp1.length == 0 && temp2.length == 0 && temp3.length == 0 && temp4.length == 2) ||
    (cnt == 1 && cnt1 == 0 && cnt2 == 0 && cnt3 == 2 && temp4.length == 2) ||
    (count == 1 && cnt == 2 && cnt1 == 0 && cnt2 == 0 && cnt3 == 1 && temp1.length == 2) ||
    (count == 1 && cnt == 2 && cnt1 == 0 && cnt2 == 1 && cnt3 == 1 && temp1.length == 2) ||
    (count == 1 && cnt == 2 && cnt1 == 1 && cnt2 == 0 && cnt3 == 0 && temp1.length == 2) ||
    (count == 1 && cnt == 1 && cnt1 == 2 && cnt2 == 0 && cnt3 == 0 && temp2.length == 2) ||
    (count == 1 && cnt == 0 && cnt1 == 2 && cnt2 == 0 && cnt3 == 1 && temp2.length == 2) ||
    (count == 1 && cnt == 1 && cnt1 == 2 && cnt2 == 0 && cnt3 == 1 && temp2.length == 2) ||
    (count == 1 && cnt == 1 && cnt1 == 2 && cnt2 == 1 && cnt3 == 0 && temp2.length == 2) ||
    (count == 1 && cnt == 0 && cnt1 == 0 && cnt2 == 2 && cnt3 == 1 && temp3.length == 2) ||
    (count == 1 && cnt == 1 && cnt1 == 0 && cnt2 == 2 && cnt3 == 1 && temp3.length == 2) ||
    (count == 1 && cnt == 1 && cnt1 == 1 && cnt2 == 2 && cnt3 == 0 && temp3.length == 2) ||
    (count == 1 && cnt == 0 && cnt1 == 1 && cnt2 == 0 && cnt3 == 2 && temp4.length == 2) ||
    (count == 1 && cnt == 0 && cnt1 == 0 && cnt2 == 1 && cnt3 == 2 && temp4.length == 2) ||
    (count == 1 && cnt == 1 && cnt1 == 0 && cnt2 == 1 && cnt3 == 2 && temp4.length == 2) ||
    (count == 1 && cnt == 1 && cnt1 == 1 && cnt2 == 0 && cnt3 == 2 && temp4.length == 2)){
      flag = true
      var winobj = { 
        "en": "DRAW",
        "data": {
          iswin: flag, 
          wintype: "jackorbetter", 
          wingold: data.betAmt * 1, 
          wincardinx: wincardinx
        }
      }
    
    return winobj
  }
}


function checkwinner(totalcard){

    //7 card possibility 
    //5 card 

    combinations = generateCombinations(totalcard,5);

    console.log("combinations ",combinations)
    console.log("combinations ",combinations.length)


}