/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const utils = require('./utils');
const QUOTES_TABLE = process.env.TABLE_QUOTES;
const UTILS_TABLE = process.env.TABLE_UTILS;
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
    },
    updateQuoteByParams(params) {
        return new Promise((resolve, reject) => {
            dynamoDb.update(params, function (err, data) {
                if (err) {
                    console.log('Error updating quote');
                    console.log(err);
                    console.log(params);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },
    setQuotesLenghtByBatch() {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: QUOTES_TABLE,
                ProjectionExpression: '#author, #id, #quote',
                FilterExpression: 'attribute_not_exists(#quote_length)',
                ExpressionAttributeNames: {
                    '#author': 'author',
                    '#id': 'id',
                    '#quote': 'quote',
                    '#quote_length': 'quote_length'
                }
            };

            utils.performScan(dynamoDb, params).then((quotes) => {
                var promises = [];

                if (!quotes || !quotes.length) {
                    reject('Nothing fetched');
                }

                for (const q of quotes) {
                    var updateParams = {
                        TableName: QUOTES_TABLE,
                        Key: {
                            author: q.author,
                            id: q.id
                        },
                        UpdateExpression: `set #quote_length = :quote_length`,
                        ExpressionAttributeNames: {
                            '#quote_length': 'quote_length'
                        },
                        ExpressionAttributeValues:{
                            ':quote_length': q.quote.length || 0
                        }
                    };
                    promises.push(this.updateQuoteByParams(updateParams));
                }

                Promise.all(promises).then((results) => {
                    resolve(results.length);
                }).catch((e) => {
                    console.log('Error updating quote lengths');
                    console.log(e);
                    reject(e);
                });
            }).catch((e) => {
                console.log('Error scanning quotes');
                console.log(e);
                reject(e);
            });
        });
    },
    getLoaderOptions(loaderName) {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: UTILS_TABLE,
                Key: {
                    name: loaderName
                }
            };

            dynamoDb.get(params, function (err, result) {
                if (err) {
                    console.log(`Error getting options for ${loaderName}`);
                    console.log(err);
                    reject(err);
                } else {
                    if (result && result.Item) {
                        resolve(result.Item);
                    } else {
                        reject();
                    }
                }
            });
        });
    },
    updateLoaderOptions(options) {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: UTILS_TABLE,
                Key: {
                    name: options.name
                },
                UpdateExpression: 'set #url_identifier = :url_identifier, #last_loaded_page = :last_loaded_page, #max_pages = :max_pages',
                ExpressionAttributeNames: {
                    '#url_identifier': 'url_identifier',
                    '#last_loaded_page': 'last_loaded_page',
                    '#max_pages': 'max_pages'
                },
                ExpressionAttributeValues: {
                    ':url_identifier': options.url_identifier,
                    ':last_loaded_page': options.last_loaded_page,
                    ':max_pages': options.max_pages
                }
            };

            dynamoDb.update(params, function (err, data) {
                if (err) {
                    console.log('Failed to update options');
                    console.log(err);
                    reject(err);
                } else {
                    resolve({status: 1, message: 'Success'});
                }
            });
        });
    },
    refineByUpdate(refinement) {
        return new Promise((resolve, reject) => {
            if (!refinement || !refinement.target || !refinement.condition) {
                reject('Invalid refinement');
            }

            const targetParamName = '#' + refinement.target.toString();
            const conditionParamName = '#' + refinement.condition.toString();
            const targetValueParam = ':' + refinement.target.toString();
            const conditionValueParam = ':' + refinement.condition.toString();
            var scanParams = {
                TableName: QUOTES_TABLE,
                ProjectionExpression: '#author, #id',
                FilterExpression: `${conditionParamName} = ${conditionValueParam}`,
                ExpressionAttributeNames: {
                    '#author': 'author',
                    '#id': 'id'
                },
                ExpressionAttributeValues: {}
            };
            scanParams.ExpressionAttributeNames[conditionParamName] = refinement.condition;
            scanParams.ExpressionAttributeValues[conditionValueParam] = refinement.conditionValue;

            utils.performScan(dynamoDb, scanParams).then((quotes) => {
                var promises = [];

                for (const quote of quotes) {
                    var params = {
                        TableName: QUOTES_TABLE,
                        Key: {
                            author: quote.author,
                            id: quote.id
                        },
                        UpdateExpression: `set ${targetParamName} = ${targetValueParam}`,
                        ExpressionAttributeNames: {},
                        ExpressionAttributeValues:{}
                    };
                    params.ExpressionAttributeNames[targetParamName] = refinement.target;
                    params.ExpressionAttributeValues[targetValueParam] = refinement.targetValue;

                    promises.push(this.updateQuoteByParams(params));
                }

                Promise.all(promises).then(() => {
                    resolve(promises.length);
                }).catch((e) => {
                    console.log('Error updating quotes');
                    console.log(e);
                    reject(e);
                });
            }).catch((e) => {
                console.log('Failed to scan quotes');
                console.log(e);
                console.log(scanParams);
                reject(e);
            });
        });
    }
};
