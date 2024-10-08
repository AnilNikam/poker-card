const mongoose = require('mongoose');
const Users = require('../../models/users');
const BankDetails = require('../../models/bankDetails');

const express = require('express');
const router = express.Router();
const config = require('../../config');
const logger = require('../../logger');


const westwallet = require('westwallet-api');
const westwalletErrors = require('westwallet-api/lib/errors');

const publicKey = "yourPublicKey";
const privateKey = "yourPrivateKey";

let client = new westwallet.WestWalletAPI(publicKey, privateKey);

/**
 * @api {post} /payment/generate Generate Address
 * @apiName GenerateAddress
 * @apiGroup Wallet
 * @apiHeader {String} x-access-token User's unique access token
 * @apiParam {String} currency The cryptocurrency code (e.g., BTC, ETH).
 * @apiParam {String} ipn_url Instant Payment Notification URL.
 * @apiParam {String} label An optional label for the address.
 * @apiSuccess (Success 200) {Object} addressInfo The generated address information.
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/address/generate', async (req, res) => {
    try {
        const { currency, ipn_url, label } = req.body;

        if (!currency || !ipn_url) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        client.generateAddress(currency, ipn_url, label)
            .then((data) => {
                res.json({ success: true, data });
            })
            .catch((error) => {
                if (error instanceof westwalletErrors.CurrencyNotFoundError) {
                    res.status(400).json({ message: "Currency not found" });
                } else {
                    res.status(500).json({ message: "Server error", error });
                }
            });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});


/**
 * @api {post} /payment/create-withdrawal Withdraw Funds
 * @apiName CreateWithdrawal
 * @apiGroup Wallet
 * @apiHeader {String} x-access-token User's unique access token
 * @apiParam {String} currency The cryptocurrency code (e.g., BTC, ETH).
 * @apiParam {Number} amount The amount to withdraw.
 * @apiParam {String} address The address to send funds to.
 * @apiSuccess (Success 200) {Object} withdrawalInfo The withdrawal information.
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/create-withdrawal', async (req, res) => {
    try {
        logger.info("create-withdrawal req.body =>", req.body)
        const { currency, amount, address } = req.body;

        if (!currency || !amount || !address) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        client.createWithdrawal(currency, amount, address)
            .then((data) => {
                res.json({ success: true, data });
            })
            .catch((error) => {
                if (error instanceof westwalletErrors.InsufficientFundsError) {
                    res.status(400).json({ message: "Insufficient funds" });
                } else if (error instanceof westwalletErrors.BadAddressError) {
                    res.status(400).json({ message: "Invalid address" });
                } else {
                    res.status(500).json({ message: "Server error", error });
                }
            });

    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});


/**
* @api {get} /admin/pay-in
* @apiName  Getpaymentconfig
* @apiGroup  Admin
* @apiHeader {String}  x-access-token Admin's unique access-key
* @apiSuccess (Success 200) {Array} badges Array of badges document
* @apiError (Error 4xx) {String} message Validation or error message.
*/
router.post('/pay-in', async (req, res) => {
    try {
        logger.info('pay-inn requet => ', req.query);

        res.status(config.OK_STATUS).json("Ok check");




    } catch (error) {
        logger.error('pay-in error => ', error);
        res.status(config.INTERNAL_SERVER_ERROR).json(error);
    }
});



/**
 * @api {post} /admin/payment/pay-out
 * @apiName pay-out
 * @apiGroup Admin
 * @apiHeader {String} x-access-token Admin's unique access-key
 * @apiSuccess (Success 200) {Array} badges Array of badges document
 * @apiError (Error 4xx) {String} message Validation or error message.
 */
router.post('/pay-out', async (req, res) => {
    try {
        logger.info('pay-out paymentconfigset request => ', req.body);

        const { amount, address, currency } = req.body;

        // Validation
        if (!amount || !address || !currency) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        // Create withdrawal using WestWallet API
        client.createWithdrawal(currency, amount, address)
            .then((data) => {
                logger.info('Withdrawal success =>', data);
                res.json({ success: true, data });
            })
            .catch((error) => {
                if (error instanceof westwalletErrors.InsufficientFundsError) {
                    logger.error('Insufficient funds');
                    res.status(400).json({ message: "Insufficient funds" });
                } else if (error instanceof westwalletErrors.BadAddressError) {
                    logger.error('Invalid address');
                    res.status(400).json({ message: "Invalid address" });
                } else {
                    logger.error('Withdrawal error =>', error);
                    res.status(500).json({ message: "Internal server error" });
                }
            });

    } catch (error) {
        logger.error('pay-out error => ', error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router;