/*jslint node: true */
/*jshint esversion: 6 */
'use strict';
const rp = require('request-promise');
const database = require('../database');
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';
const cheerio = require('cheerio');
const utils = require('./../utils');

//max: 927065
//jordan_peterson_
module.exports = {
    load(operation, resolve, reject) {
        if (DEBUG_MODE) {
            console.log(operation);
        }

        if(!operation.params.url) {
            reject({error: 'Called without url'});
            return;
        }

        if (operation.params.lastloadedul === operation.params.maxul) {
            reject({message: 'Everything loaded already'});
            return;
        }

        var options = {
            method: 'GET',
            url: operation.params.url
        };

        rp(options, (error, response, body) => {
            if (error) {
                console.log('Error getting quotes');
                console.log(error);
                reject(error);
            } else {
                var results = [];
                const $ = cheerio.load(body);
                const quotes = $('#mw-content-text ul');
                var found = false;
                quotes.each(function (i, elem) {
                    console.log(i);
                    console.log(operation.params.lastloadedul);
                    if (i === operation.params.lastloadedul && !found) {
                        found = true;
                        operation.params.lastloadedul++;

                        var lis = $(this).children('li');
                        lis.each(function(i, elem) {
                            var quoteText = $(this).text().trim();

                            //Quote has quotation marks around it and propably something unwanted after last. Getting rid of those
                            const firstMark = quoteText.indexOf('"');
                            var lastMark = quoteText.lastIndexOf('"');
                            if (firstMark === 0 && firstMark !== lastMark && lastMark > -1 ) {
                                quoteText = quoteText.substring(firstMark + 1, lastMark);
                            }
                            var id = utils.createHash(quoteText);
                            var newQuote = {id: id, author: operation.params.author, quote: quoteText, vendor: 'mediawiki', quote_length: quoteText.length, times_published: 0};

                            results.push(newQuote);
                        });
                    }
                });

                if (!found) {
                    operation.params.maxul = operation.params.lastloadedul;
                }
                database.updateOperation(operation).then(() => {
                    resolve({status: 1, quotes: results, message: `Loaded ${results.length} quotes`});
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