/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const stands4Loader = require('./loaders/stands4Loader');

module.exports = {
    load(source, data) {
        return new Promise((resolve, reject) => {
            switch (source) {
                case 'STANDS4':
                    stands4Loader.load(data, resolve, reject);
                    break;
                default:
                    reject({status: 0, message: 'No matching source given'});
                    break;
            }
        });

    }
};