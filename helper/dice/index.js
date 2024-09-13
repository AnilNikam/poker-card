
const { getBetList } = require('./betList');
const { joinTable } = require("./joinTable");
const { leaveTable } = require("./leaveTable");
const { disconnectTableHandle, findDisconnectTable } = require("./disconnectHandle");
const { cardPack, seeCard, chal, show, getNumber, selectDiceNumber } = require("./gamePlay");

module.exports = {
  getBetList: getBetList,
  joinTable: joinTable,
  getNumber: getNumber,
  cardPack: cardPack,
  seeCard: seeCard,
  selectDiceNumber: selectDiceNumber,
  chal: chal,
  show: show,
  leaveTable: leaveTable,
  findDisconnectTable: findDisconnectTable,
  disconnectTableHandle: disconnectTableHandle,
};
