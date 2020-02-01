/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const database = require('../database');
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';

module.exports = {
    test() {
        if (DEBUG_MODE) {
            console.log('Starting testing');
        }

        return database.test();
    }
};