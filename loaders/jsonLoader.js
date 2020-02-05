/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const crypto = require('crypto');
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';

function _parseResults(results) {
    var parsedResults = [];

    for (const r of results) {
        var checksum = crypto.createHash('sha1');
        checksum.update(r.quote);
        var id = checksum.digest('hex');
        parsedResults.push({
            author: r.author,
            quote: r.quote,
            id:id,
            vendor: 'file',
            quote_length: r.quote.length || 0,
            times_published: 0,
            reviewed: r.reviewed === 1 ? 1 : 0
        });
    }

    return parsedResults;
}

module.exports = {
    load(quotes) {
        return new Promise((resolve, reject) => {
            if (DEBUG_MODE) {
                console.log(quotes);
            }

            if(!quotes.length) {
                reject({error: 'No quotes to insert'});
                return;
            }

            resolve({status: 1, quotes: _parseResults(quotes), message: 'Done'});
        });
    }
};