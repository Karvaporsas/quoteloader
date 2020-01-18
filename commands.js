/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const loadHandler = require('./handlers/loadHandler');
const refineHandler = require('./handlers/refineHandler');

module.exports = {
    process(command, source, data) {
        switch (command) {
            case 'load':
                return loadHandler.load(source, data);
            case 'refine':
                return refineHandler.refine(data);
            case 'calculatelengths':
                return refineHandler.calculateLengths();
            case 'initpublishedtimes':
                return refineHandler.setTimesPublished();
            default:
                return new Promise((resolve, reject) => {
                    reject('Unknown comand');
                });
        }
    },
};