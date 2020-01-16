/*jslint node: true */
/*jshint esversion: 6 */
'use strict';
const rp = require('request-promise');
const crypto = require('crypto');
const cheerio = require('cheerio');
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

        var options = {
            method: 'GET',
            url: `https://www.goodreads.com/author/quotes/7014283.G_K_Chesterton?page=1`
        };

        rp(options, (error, response, body) => {
            if (error) {
                console.log('Error getting quotes');
                console.log(error);
                reject(error);
            } else {
                const $ = cheerio.load(body);
                const quotes = $('.quoteText');

                quotes.each(function (i, elem) {
                    var quoteText = $(this).text().trim();
                    var quoteAuthor = $(this).children('.authorOrTitle').text().trim();

                    console.log("Author:");
                    console.log(quoteAuthor);
                    console.log("Text");
                    console.log(quoteText);
                });

                for (const key in quotes) {
                    if (quotes.hasOwnProperty(key)) {
                        const element = quotes[key];
                        //console.log(element);

                    }
                }

                resolve({status: 0});
            }
        }).catch(e => {
            console.log('Error getting quotes');
            console.log(e);
            reject(e);
        });
    }
};