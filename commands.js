/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const loadHandler = require('./handlers/loadHandler');
const refineHandler = require('./handlers/refineHandler');
const testHandler = require('./handlers/testHandler');

module.exports = {
    process(command, data) {
        switch (command) {
            case 'load':
            case 'autoload':
                return loadHandler.autoLoad();
            case 'autorefine':
                return refineHandler.autoRefine();
            case 'refine':
                return refineHandler.refine(data);
            case 'calculatelengths':
                return refineHandler.calculateLengths();
            case 'initpublishedtimes':
                return refineHandler.setTimesPublished();
            case 'insertFromFile':
                return loadHandler.readFromFile();
            case 'testInjection':
                return testHandler.test();
            default:
                return new Promise((resolve, reject) => {
                    reject('Unknown comand');
                });
        }
    },
};