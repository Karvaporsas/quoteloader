/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const loadHandler = require('./loadHandler');
const storeHander = require('./storeHandler');
const STANDS4 = 'STANDS4';
/**
 * Basic AWS Lambda handler.
 * @param event Message from Telegram
 * @param context Lambda context
 * @returns HTML status response with statusCode 200
 */
exports.handler = (event, context) => {
    console.log('starting to process message');

    const standardResponse = {
        statusCode: 200,
    };

    loadHandler.load(STANDS4, event).then((results) => {
        console.log('Loading was successful');
        storeHander.store(results.quotes).then(() => {
            context.succeed('Quotes handled');
        }).catch((e) => {
            console.log('Failed to store quotes');
            console.log(e);
            context.fail(e);
        });

    }).catch((e) => {
        console.log('Error while loading');
        console.log(e);
        context.fail(e);
    });

    return standardResponse;
};