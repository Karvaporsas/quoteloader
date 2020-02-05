/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const AWS = require('aws-sdk');
const utils = require('./utils');
const QUOTES_TABLE = process.env.TABLE_QUOTES;
const OPERATIONS_TABLE = process.env.TABLE_OPERATIONS;
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';
const dynamoDb = new AWS.DynamoDB.DocumentClient();

function _insertQuotePromise(quote, self, insertedQuotes) {
    return self.insertQuote(quote).then((res) => {
        if (res) insertedQuotes.push(res);

        return res;
    });
}

module.exports = {
    insertQuotes(quotes) {
        return new Promise((resolve, reject) => {
            var insertedQuotes = [];
            if (!quotes.length) {
                if (DEBUG_MODE) {
                    console.log('No quotes to store!');
                }
                resolve({status: 0, message: 'nothing to insert'});
            } else {
                var promises = [];
                for (const quote of quotes) {
                    promises.push(_insertQuotePromise(quote, this, insertedQuotes));
                }

                Promise.all(promises).then(() => {
                    resolve({status: 1, message: 'quotes inserted', quotes: insertedQuotes});
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
                Item: quote,
                ConditionExpression: 'attribute_not_exists(id)'
            };

            dynamoDb.put(params, function (err) {
                if (err && err.code !== 'ConditionalCheckFailedException') {
                    console.log(`Error inserting quote ${quote.id}`);
                    console.log(err);
                    reject(err);
                } else if (err && err.code === 'ConditionalCheckFailedException') {
                    resolve();
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
    setQuotesTimesPublishedByBatch() {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: QUOTES_TABLE,
                ProjectionExpression: '#author, #id',
                FilterExpression: 'attribute_not_exists(#times_published)',
                ExpressionAttributeNames: {
                    '#author': 'author',
                    '#id': 'id',
                    '#times_published': 'times_published'
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
                        UpdateExpression: `set #times_published = :times_published`,
                        ExpressionAttributeNames: {
                            '#times_published': 'times_published'
                        },
                        ExpressionAttributeValues:{
                            ':times_published': 0
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
    updateOperation(operation) {
        return new Promise((resolve, reject) => {
            var d = new Date();
            var params = {
                TableName: OPERATIONS_TABLE,
                Key: {
                    name: operation.name
                },
                UpdateExpression: 'set #yr = :yr, #mon = :mon, #day = :day, #hour = :hour, #minute = :minute',
                ExpressionAttributeNames: {
                    '#yr': 'yr',
                    '#mon': 'mon',
                    '#day': 'day',
                    '#hour': 'hour',
                    '#minute': 'minute',
                    '#params': 'params'
                },
                ExpressionAttributeValues: {
                    ':yr': d.getFullYear(),
                    ':mon': d.getMonth(),
                    ':day': d.getDate(),
                    ':hour': d.getHours(),
                    ':minute': d.getMinutes()
                }
            };

            for (const key in operation.params) {
                if (operation.params.hasOwnProperty(key)) {
                    const value = operation.params[key];
                    const attributeNamePlaceholder = `#${key}`;
                    const attributeValuePlaceholder = `:${key}`;

                    params.UpdateExpression += `, #params.#${key} = :${key}`;
                    params.ExpressionAttributeNames[attributeNamePlaceholder] = key;
                    params.ExpressionAttributeValues[attributeValuePlaceholder] = value;
                }
            }
            console.log(params);
            dynamoDb.update(params, function (err, data) {
                if (err) {
                    console.log('Error while updating operation');
                    console.log(err);
                    reject(err);
                } else {
                    resolve({status: 1, message: 'success'});
                }
            });
        });
    },
    getOldestOperation(maintype) {
        return new Promise((resolve, reject) => {
            var params = {
                TableName: OPERATIONS_TABLE,
                FilterExpression: '#maintype = :maintype and #active = :istrue',
                ExpressionAttributeNames: {
                    '#maintype': 'maintype',
                    '#active': 'active'
                },
                ExpressionAttributeValues: {
                    ':maintype': maintype,
                    ':istrue': true
                }
            };

            utils.performScan(dynamoDb, params).then((operations) => {
                if (!operations || !operations.length) {
                    reject('No operations found');
                } else {
                    for (const op of operations) {
                        var d = new Date(op.yr, op.mon, op.day, op.hour, op.minute);
                        op.lastRun = d;
                    }
                    operations.sort(function (a, b) {
                        return a.lastRun - b.lastRun;
                    });

                    resolve(operations[0]);
                }
            }).catch((e) => {
                console.log('Error getting operations');
                console.log(e);
                reject(e);
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
                FilterExpression: `${conditionParamName} = ${conditionValueParam} and ${targetParamName} <> ${targetValueParam}`,
                ExpressionAttributeNames: {
                    '#author': 'author',
                    '#id': 'id'
                },
                ExpressionAttributeValues: {}
            };
            scanParams.ExpressionAttributeNames[conditionParamName] = refinement.condition;
            scanParams.ExpressionAttributeNames[targetParamName] = refinement.target;
            scanParams.ExpressionAttributeValues[conditionValueParam] = refinement.conditionValue;
            scanParams.ExpressionAttributeValues[targetValueParam] = refinement.targetValue;

            utils.performScan(dynamoDb, scanParams).then((quotes) => {
                console.log(`Found ${quotes.length} quotes to refine`);
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
    },
    test() {
        return new Promise((resolve, reject) => {
            var id = 'test and author = Lewis';
            var params = {
                TableName: QUOTES_TABLE,
                ProjectionExpression: '#author, #id, #quote',
                FilterExpression: '#id = :id',
                ExpressionAttributeNames: {
                    '#author': 'author',
                    '#id': 'id',
                    '#quote': 'quote'
                },
                ExpressionAttributeValues: {
                    ':id': id
                }
            };

            utils.performScan(dynamoDb, params).then((quotes) => {
                console.log('found something');
                console.log(quotes);
                resolve(quotes);
            }).catch((e) => {
                console.log('Error happened');
                console.log(e);
                reject(e);
            });
        });
    }
};
