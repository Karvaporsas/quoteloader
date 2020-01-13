/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const database = require('../database');
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';

module.exports = {
    store(quotes) {
        if (DEBUG_MODE) {
            console.log('starting to store quotes');
        }

        return database.insertQuotes(quotes);
    }
};