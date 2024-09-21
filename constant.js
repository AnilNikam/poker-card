const CONST = {
  // card deck array for distribute
  // prettier-ignore
  deckOne: [
    'H-1', 'H-2', 'H-3', 'H-4', 'H-5', 'H-6', 'H-7', 'H-8', 'H-9', 'H-10', 'H-11', 'H-12', 'H-13',
    'S-1', 'S-2', 'S-3', 'S-4', 'S-5', 'S-6', 'S-7', 'S-8', 'S-9', 'S-10', 'S-11', 'S-12', 'S-13',
    'D-1', 'D-2', 'D-3', 'D-4', 'D-5', 'D-6', 'D-7', 'D-8', 'D-9', 'D-10', 'D-11', 'D-12', 'D-13',
    'C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'C-7', 'C-8', 'C-9', 'C-10', 'C-11', 'C-12', 'C-13'
  ],

  // table status
  PLAYING: 'PLAYING',
  LOCKED: 'LOCKED',
  RESTART: 'RESTART',
  // GAME_START_TIMER: "GAME_START_TIMER",
  LOCK_IN_PERIOD: 'LOCK_IN_PERIOD',
  WAITING: 'WAITING',
  BOT_WAITING: 'BOT_WAITING',
  ROUND_STARTED: 'RoundStated',
  ROUND_START_TIMER: 'GameStartTimer',
  ROUND_COLLECT_BOOT: 'CollectBoot',
  ROUND_END: 'RoundEndState',
  ROUND_LOCK: 'RoundLock',
  GAMEPLAY: 'GAMEPLAY',
  CARD_DEALING: 'CardDealing',
  SELECT_DICE: 'SelectDiceNumber',

  // SPENN Paymnent Key
  API_KEY: 'Owiv+7//L9E3TsxkJuBHAInUSPHYfVJIw2KKcPjpyrZA4bBxxnDFHbL7c0yAyRADbO/REty9bwU=',

  // Entry Fee
  CHAT_MESSAGES: ['Hi All', 'Welcome', 'Please Play Fast', 'Well done!', 'Good turn', 'Bye', 'Try next time', 'Where are you from? I am from ', 'Finally I won'],

  POOL_DETAIL_OF_101: '101POOL',
  POOL_DETAIL_OF_201: '201POOL',
  //--------------------------------------------------------------------------------------------
  //Login && Signup
  //--------------------------------------------------------------------------------------------
  LOGIN: 'LOGIN',
  SIGNUP: 'SIGNUP',
  VERIFY_OTP: 'VOTP',
  RESEND_OTP: 'ROTP',
  CHECK_REFERAL_CODE: 'CRC',
  CHECK_MOBILE_NUMBER: 'CMN',
  CHECK_KYC_ADHARA_NUMBER: 'CKAN',
  VERIFY_KYC_ADHARA_NUMBER: 'VKAN',
  VERIFY_KYC_PAN_CARD: 'VKPC',



  OLD_SESSION_RELEASE: 'OSR',
  DASHBOARD: 'DASHBOARD',
  WALLET_UPDATE: 'WU',

  // Socket events names
  JOIN: 'JOIN',
  JOIN_TABLE: 'JT',
  JOIN_SIGN_UP: 'SP',
  GAME_TABLE_INFO: 'GTI',
  PING: 'PING',
  PICK_CARD: 'PIC',
  DISCARD: 'DIC',
  CARD_GROUP: 'CG',
  DECLARE: 'DEC',
  FINISH: 'FNS',
  FINISH_TIMER_SET: 'FTS',
  INVALID_DECLARE: 'IND',
  PLAYER_CARD_ACTION: 'PCA',
  INVALID_PLAYER_CARD_ACTION: 'IPCA',
  GAME_CARD_DISTRIBUTION: 'GCD',
  DONE: 'DONE',
  ERROR: 'ERROR',
  PONG: 'PONG',
  USER_TURN_START: 'UTS',
  GAME_TIME_START: 'GTS',
  INSUFFICIENT_CHIPS: 'IC',
  WIN: 'WIN',
  GAME_SCORE_BOARD: 'GSB',
  USER_TIME_OUT: 'UTO',
  USER_FINAL_TIMEOUT: 'UFTO',
  SEND_MESSAGE_TO_TABLE: 'MSGTT',
  LEAVE: 'LEAVE',
  SWITCH_TABLE: 'SWITCH',
  GAME_REPORT_PROBLEM: 'GRP',
  STAND_UP: 'STANDUP',
  LAST_GAME_SCORE_BOARD: 'LGSB',
  DEMO_LAST_GAME_SCORE_BOARD: 'DLGSB',
  PLAYER_INFORMATION: 'PI',
  UPDATE_GAME_COIN: 'UGC',
  REGISTER_USER: 'RU',
  SIGN_IN: 'SI',
  OPEN_CHAT_PANEL: 'OCP',
  SEND_MESSAGE: 'SM',
  AUTO_LOGIN: 'AL',
  MANUAL_LOGIN: 'ML',
  PRIVATE_TABLE: 'PT',
  CREATE_PRIVATE_TABLE_ID: 'CPTI',
  JOIN_PRIVATE_TABLE: 'JPT',
  PRIVATE_TABLE_NOT_FOUND: 'PTNF',
  FRIEND_REQUEST_RESULT: 'FRR',
  RECEIVE_FRIEND_REQUEST: 'RFR',
  UNFRIEND_REQUEST: 'UFR',
  LOCAL_FRIEND_LIST: 'LFL',
  FRIEND_LEADERBOARD: 'FLB',
  SEND_OTP: 'SOTP',
  PRIVATE_TABLE_START: 'PTS',
  INAPP_PURCHASE_DONE: 'IAPD',
  USER_UPDATE_PROFILE: 'UUP',
  LOGOUT: 'LOGOUT',
  EXIT: 'EXIT',
  VALIDATE_CARD: 'VC',

  POOL_GET_BET_LIST: 'PGBL',
  RECONNECT: 'RE',
  PLAYER_BALANCE: 'PB',
  MYWALLET: "MYWALLET",
  DEPOSITE_AMOUNT: 'DA',
  INVALID_EVENT: 'IE',
  COUNTER: 'COUNTER',
  FLUTTERWAVE_WITHDRAW: 'FW',
  UPDATE_WALLET: 'UW',
  SPENN_DEPOSIT: 'SD',
  SPENN_RECEIVE: 'SR',
  PLAYER_PAYMENT_HISTORY: 'PH',
  SPENN_NOTIFICATION: 'SN',
  BORROW_USER_CHIPS: 'BUC',
  DECLARE_TIMER_SET: 'DTS',
  RESTART_GAME_TABLE: 'RGT',
  PLAYER_FINISH_DECLARE_TIMER: 'PFDT',
  // new
  GET_BET_LIST: 'GBL',
  TAKEACTION: "TAC",
  OPENCARD: "OPENCARD",
  USER_JOIN_IN_TABLE: 'UJIT',
  TABLE_FULL_DATA: 'TFD',
  GAME_START_TIMER: 'GST',
  COLLECT_BOOT: 'CB',
  LEAVE_TABLE: 'LT',
  USER_CARD: 'UC',
  TABLE_CARD_DEAL: 'TCD',
  TURN_START: 'TS',
  PACK: 'PACK',
  WINNER: 'WINNER',
  TABLE_USER_WALLET_UPDATE: 'TUWU',
  KILL: 'KILL',
  FLUTTERWAVE_MOBILE_MONEY_DEPOSIT: 'FMMD',
  WEB_VIEW_CLOSE: 'WVC',
  LAST_POOL_POINT: 'LPP',
  DEMO_LAST_POOL_POINT: 'DEMOLPP',
  RE_JOIN: 'RE_JOIN',
  DISCONNECT: 'DISCONNECT',
  ALREADY_PLAYER_AXIST: 'APA',
  TAKE_SEAT: 'TS',
  RE_BUY: 'RB',
  EDIT_MOBILE: 'EM',
  ADD_BANK_ACCOUNT: 'ADDBANK',
  GET_BANK_DETAILS: 'GBD',
  USER_MESSAGE: "UM",

  // Player Status
  WATCHING: 'WATCHING',
  DECLARED: 'DECLARED',
  LEFT: 'LEFT',
  INVALID_DECLARED: 'INVALID_DECLARED',
  VALID_DECLARED: 'VALID_DECLARED',
  DROPPED: 'DROP',
  LOST: 'LOST',
  WON: 'WON',
  FINISHED: 'FINISHED',
  EXPELED: 'EXPELED',
  LEADER_BOARD: 'LB',
  ADD_FRIEND: 'AF',
  CHANGE_PASWORD: 'CP',
  FORGOT_PASWORD: 'FP',
  USER_PROFILE_DETAILS: 'UPD',
  USER_PROFILE_UPDATE: 'UUP',
  STOP_GAME_TIMER: 'SGT',
  UPDATE_CARD_STATUS: 'UCS',
  NOTIFICATION: 'NOTIFICATION',
  FLUTTERWAVE_BENEFICIARY: 'FB',
  PAYMENT_NOTIFICATION: 'PN',
  FLUTTERWAVE_KYC: 'FK',
  FLUTERWAVE_SAVE_DATA: 'FSD',
  INSUFFICIENT_MONEY: 'IM',
  FLUTTERWAVE_MOBILE_ADD_MONEY: 'FMAM',
  RE_JOIN_UPDATE_SCORE: 'RJUS',
  REMOVE_USERSOCKET_FROM_TABLE: 'RUFT',
  DEAL_BET_LIST: 'DBT',
  KYC: 'KYC',
  REFFERAL: 'REFFERAL',
  WALLET_TRANSACTION_HISTORY: 'TRAN_HISTORY',
  EXIST_SOCKET_ID: 'EXISTSOCKET',
  BANK_ACCOUNT_VERIFY: 'BANKVERIFY',

  //AVAITOR
  AV_JOIN_SIGN_UP: "AVSP",
  ACTION: "ACTION",
  CANCEL: "CANCEL",
  MYBET: "MYBET",
  CHECKOUT: "CHECKOUT",
  PLAYERLIST: "PLAYERLIST",
  MYREFLIST: "MYREFLIST",
  AV_LEAVE_TABLE: "AV_LT",
  AV_RECONNECT: "AV_RECONNECT",
  AVIATOR_JT: "AVIATORJT",
  AVIATOR_GTI: "AVIATORGTI",
  AVIATORGST: "AVIATORGST",
  STARTAVIATOR: "STARTAVIATOR",

  //Dice
  D_JOIN_SIGN_UP: "DSP",
  DICE_JOIN_TABLE: "DJT",
  DICE_GAME_TABLE_INFO: "DJTI",
  GET_DICE_BET_LIST: "DBL",
  DICE_GAME_START_TIMER: "DGS",
  DICE_COLLECT_BOOT: "DCB",
  SELECT_DICE_NUMBER: "SDN",
  DICE_ACTION: "DA",
  DICE_USER_TURN_START: 'DUTS',
  GET_DICE_NUMBER: "GDN",
  DICE_LEAVE_TABLE: "DLT",
  DICE_ROUND_START: 'DRS',
  DICE_WINNER: "DWIN",

  // Timer
  userTurnTimer: 29,
  gameStartTime: 15,
  gameCardDistributeDelayTime: 1,
  finishTimer: 20,
  rsbTimer: 4,
  restartTimer: 5,

  // commission
  commission: 10,
  POOL_COMMISSION: 15,


  // player score
  PLAYER_SCORE: 80,
  GAME_PLAY_COST: 3,
  PLAYER_LEAVE_SCORE: 20,
  FIRST_DROP: 20,
  SECOND_DROP: 40,
  TIME_TURN_OUT_COUNTER: 3,
  COMPUTER_TIME_TURN_OUT_COUNTER: 3,

  // Player
  TOTAL_PLAYER: 5,
  COMPUTER_TOTAL_PLAYER: 2,
  TOTAL_PLAYER_FOR_COMPUTER: 2,
  SIGN_UP_PLAYER_COIN: 500,
  // AVAILABLE_SEAT_POSITION: [5, 4, 3, 2, 1, 0],

  // Variable Name
  TOTAL_PLYING_POINT: 'TPP',
  TOTAL_WINNING_POINT: 'TWP',

  TOTAL_PLYING_POOL: 'TPPO',
  TOTAL_WINNING_POOL: 'TWPP',

  TOTAL_PLYING_DEAL: 'TPD',
  TOTAL_WINNING_DEAL: 'TWD',

  COIN_TRANSACTION: {
    MATCH_WON: 'Match Won',
    AD_VIEWED: 'Ad Viewed',
    DEFAULT: 'Registration',

    MATCH_LOST: 'Match Lost',
    DECLARED: 'Invalid Declared',
    DECLARED_WON: 'Declared Won',
    GAME_LEAVE: 'Leave Game',
  },

  //Payment Getway
  PAY_IN: 'PAYIN',
  CREATE_PAY_OUT: 'PAYOUT',
  CHECK_PAY_OUT_STATUS: 'PAYOUT_STATUS',

  // friendship status
  // 1 for pending 2 for approved,3 for decline

  FRIENDSHIP: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECT: 'decline',
  },

  LOGIN_TYPE: {
    LOGIN: 'Login',
    SIGNUP: 'SignUp',
  },

  GAME_TYPE: {
    POINT_RUMMY: 'pointrummy',
    POOL_RUMMY: 'poolrummy',
    DEAL_RUMMY: 'dealrummy',
  },
  COUNTRY_CODE: process.env.COUNTRY_CODE || '+91',

  MONTHS: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

module.exports = CONST;
