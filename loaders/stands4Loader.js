/*jslint node: true */
/*jshint esversion: 6 */
'use strict';
const rp = require('request-promise');
const crypto = require('crypto');
const database = require('../database');
const UID = process.env.UID;
const TOKENID = process.env.TOKENID;
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';
const RESULT_FORMAT = 'json';
const AUTHOR_QUERY = process.env.AUTHOR_QUERY || '';

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
            vendor: 'STANDS4',
            quote_length: r.quote.length || 0,
            times_published: 0
        });
    }

    return parsedResults;
}

module.exports = {
    load(operation, resolve, reject) {
        if (DEBUG_MODE) {
            console.log(
                operation
            );
        }

        if(!operation.params.type) {
            reject({error: 'Called without type'});
            return;
        }

        var options = {
            method: 'GET',
            url: `https://www.stands4.com/services/v2/quotes.php?uid=${UID}&tokenid=${TOKENID}&searchtype=${operation.params.type}`
        };

        var queryString = '';
        switch (operation.params.type) {
            case 'RANDOM':
                queryString = '';
                break;
            case 'AUTHOR':
                var q = operation.params.query || AUTHOR_QUERY;
                queryString = `&query=${q}`;
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
                const quoteData = JSON.parse(body);
                if (Object.keys(quoteData).length === 0 || (quoteData.result && typeof quoteData.result.quote === 'object')) {
                    resolve({status: 0, quotes: [], message: 'No quotes'});
                } else {
                    var results = quoteData.result;
                    if (!Array.isArray(results)) results = [quoteData.result];
                    database.updateOperation(operation).then(() => {
                        resolve({status: 1, quotes: _parseResults(results), message: `Got ${results.length} quotes`});
                    }).catch((e) => {
                        reject(e);
                    });
                }
            }
        }).catch(e => {
            console.log('Error getting quote');
            console.log(e);
            reject(e);
        });
    }
};