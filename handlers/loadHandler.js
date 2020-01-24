/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const stands4Loader = require('../loaders/stands4Loader');
const storeHandler = require('./storeHandler');
const goodreadsLoader = require('../loaders/goodreadsLoader');
const database = require('../database');
const brainyLoader = require('../loaders/brainyquoteLoader');
const mediawikiLoader = require('../loaders/mediawikiLoader');

function _load(operation) {
    return new Promise((resolve, reject) => {
        switch (operation.type) {
            case 'STANDS4':
            case 'stands4loader':
                stands4Loader.load(operation, resolve, reject);
                break;
            case 'goodreadsloader':
            case 'goodreads':
                goodreadsLoader.load(operation, resolve, reject);
                break;
            case 'brainy':
                brainyLoader.load(operation, resolve, reject);
                break;
            case 'mediawiki':
                mediawikiLoader.load(operation, resolve, reject);
                break;
            default:
                reject({status: 0, message: 'No matching source given'});
                break;
        }
    });
}

module.exports = {
    autoLoad() {
        return new Promise((resolve, reject) => {
            database.getOldestOperation('loader').then((operation) => {
                _load(operation).then((results) => {
                    console.log('Loading was successful');
                    storeHandler.store(results.quotes).then((insertResult) => {
                        var amt = (insertResult.quotes ? insertResult.quotes.length : 0);

                        resolve(`${amt} quotes loaded in operation ${operation.name} from ${operation.type}. ${results.message}`);
                    }).catch((e) => {
                        reject(e);
                    });
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        });
    },
    readFromFile() {
        return new Promise((resolve, reject) => {
            const quotesToInsert = require('../quotesToInsert.json');
            const jsonLoader = require('../loaders/jsonLoader');

            jsonLoader.load(quotesToInsert.quotes).then((loadingResults) => {
                storeHandler.store(loadingResults.quotes).then((insertResult) => {
                    var amt = (insertResult.quotes ? insertResult.quotes.length : 0);

                    resolve(`${amt} quotes loaded by jsonLoader`);
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        });
    }
};