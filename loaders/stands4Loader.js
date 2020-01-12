/*jslint node: true */
/*jshint esversion: 6 */
'use strict';
const rp = require('request-promise');
const crypto = require('crypto');
const UID = process.env.UID;
const TOKENID = process.env.TOKENID;
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';
const RESULT_FORMAT = 'json';

function _parseResults(results) {
    var parsedResults = [];

    for (const r of results) {
        var checksum = crypto.createHash('sha1');
        checksum.update(r.quote);
        var id = checksum.digest('hex');
        parsedResults.push({
            author: r.author,
            quote: r.quote,
            id:id
        });
    }

    return parsedResults;
}

module.exports = {
    load(data, resolve, reject) {
        if (DEBUG_MODE) {
            console.log(data);
        }

        if(!data.searchtype) {
            reject({error: 'Called without searchtype'});
            return;
        }

        var options = {
            method: 'GET',
            url: `https://www.stands4.com/services/v2/quotes.php?uid=${UID}&tokenid=${TOKENID}&searchtype=${data.searchtype}`
        };

        var queryString = '';
        switch (data.searchtype) {
            case 'RANDOM':
                queryString = '';
                break;
            case 'AUTHOR':
                queryString = `&query=${data.query}`;
                break;
            default:
                queryString = '';
                break;
        }

        options.url += queryString;
        options.url += `&format=${RESULT_FORMAT}`;

        rp(options, (error, response, body) => {
            if (error) {
                console.log('Error getting quote');
                console.log(error);
                reject(error);
            } else {
                console.log('Success');
                const quoteData = JSON.parse(body);
                var results = quoteData.result;

                if (!Array.isArray(results)) results = [quoteData.result];

                resolve({status: 1, quotes: _parseResults(results), message: 'Got quotes'});
            }
        }).catch(e => {
            console.log('Error getting quote');
            console.log(e);
            reject(e);
        });
    }
};