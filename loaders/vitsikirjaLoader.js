/*jslint node: true */
/*jshint esversion: 6 */
'use strict';
const rp = require('request-promise');
const cheerio = require('cheerio');
const utils = require('./../utils');
const database = require('./../database');
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';

module.exports = {
    load(operation, resolve, reject) {
        if (DEBUG_MODE) {
            console.log(operation);
        }
        var params = operation.params;
        if (params.lastloadedpage === params.maxpages) {
            reject({message: 'Everything loaded already'});
            return;
        }
        const page = params.lastloadedpage + 1;
        var options = {
            method: 'GET',
            url: `https://vitsikirja.net/page/${page}/`
        };
        params.lastloadedpage++;
        rp(options, (error, response, body) => {
            if (error) {
                console.log('Error getting quotes');
                console.log(error);
                reject(error);
            } else {
                var results = [];
                const $ = cheerio.load(body);
                const quotes = $('.post-content.image-caption-format-1');

                quotes.each(function (i, elem) {
                    var elemNr = 3;
                    var quoteText = $(this).children(`p:nth-child(${elemNr++})`).text().trim();
                    var nextPart = $(this).children(`p:nth-child(${elemNr++})`).text().trim();
                    while(nextPart && nextPart.length > 3) {
                        quoteText += ' ' + nextPart;
                        nextPart = $(this).children(`p:nth-child(${elemNr++})`).text().trim();
                    }
                    var quoteAuthor = 'Voi Vitsi';

                    var id = utils.createHash(quoteText);
                    results.push({id: id, author: quoteAuthor, quote: quoteText, vendor: 'vitsikirja', quote_length: quoteText.length, times_published: 0});
                });
                operation.params = params;
                database.updateOperation(operation).then(() => {
                    resolve({status: 1, quotes: results, message: `Got ${results.length} quotes`});
                }).catch((e) => {
                    reject(e);
                });

            }
        }).catch(e => {
            console.log('Error getting quotes');
            console.log(e);
            reject(e);
        });
    }
};