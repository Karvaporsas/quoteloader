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
        if(!quotes || !quotes.length) {
            return new Promise((resolve, reject) => {
                resolve({status: 1, message: 'quotes inserted', quotes: 0});
            });
        }

        return database.insertQuotes(quotes);
    }
};