/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const QUOTES_TABLE = process.env.TABLE_QUOTES;
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports = {
    insertQuotes(quotes) {
        return new Promise((resolve, reject) => {
            if (!quotes.length) {
                if (DEBUG_MODE) {
                    console.log('No quotes to store!');
                }
                resolve({status: 0, message: 'nothing to insert'});
            } else {
                var promises = [];
                for (const quote of quotes) {
                    promises.push(this.insertQuote(quote));
                }

                Promise.all(promises).then(() => {
                    resolve({status: 1, message: 'quotes inserted', quotes: quotes});
                }).catch((e) => {
                    console.log('Error inserting quotes');
                    console.log(e);
                    reject(e);
                });
            }
        });
    },
    insertQuote(quote) {
        return new Promise((resolve, reject) => {
            const params = {
                TableName: QUOTES_TABLE,
                Item: quote
            };

            dynamoDb.put(params, function (err) {
                if (err) {
                    console.log(`Error inserting quote ${quote.id}`);
                    console.log(err);
                    reject(err);
                } else {
                    resolve(quote);
                }
            });
        });
    }

};
