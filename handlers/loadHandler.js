/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const stands4Loader = require('../loaders/stands4Loader');
const storeHandler = require('./storeHandler');
const goodreadsLoader = require('../loaders/goodreadsLoader');

function _load(source, data) {
    return new Promise((resolve, reject) => {
        switch (source) {
            case 'STANDS4':
                stands4Loader.load(data, resolve, reject);
                break;
            case 'goodreads':
                goodreadsLoader.load(data, resolve, reject);
                break;
            default:
                reject({status: 0, message: 'No matching source given'});
                break;
        }
    });
}

module.exports = {
    load(source, data) {
        return new Promise((resolve, reject) => {
            _load(source,data).then((results) => {
                console.log('Loading was successful');
                storeHandler.store(results.quotes).then((insertResult) => {
                    var amt = (insertResult.quotes ? insertResult.quotes.length : 0);
                    resolve(`${amt} quotes handled`);
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        });
    }
};