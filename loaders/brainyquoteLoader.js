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

        if(!operation.params.urlcipher) {
            reject({error: 'Called without urlcipher'});
            return;
        }

        if (operation.params.lastloadedid === operation.params.maxid) {
            reject({message: 'Everything loaded already'});
            return;
        }

        var options = {
            method: 'GET',
            url: `https://www.brainyquote.com/quotes/${operation.params.urlcipher}${operation.params.lastloadedid}`
        };

        rp(options, (error, response, body) => {
            var lastQuoteText = '';
            if (error) {
                console.log('Error getting quotes');
                console.log(error);
                reject(error);
            } else {
                var results = [];
                const $ = cheerio.load(body);
                const quotes = $('.quoteContent');

                quotes.each(function (i, elem) {
                    var quoteText = $(this).find('.qt_' + operation.params.lastloadedid).text().trim();
                    var quoteAuthor = $(this).find('.qa_' + operation.params.lastloadedid).text().trim();
                    //Quote has quotation marks around it and propably something unwanted after last. Getting rid of those
                    const firstMark = quoteText.indexOf('"');
                    var lastMark = quoteText.lastIndexOf('"');
                    if (firstMark === 0 && firstMark !== lastMark && lastMark > -1 ) {
                        quoteText = quoteText.substring(firstMark + 1, lastMark);
                    }
                    var id = utils.createHash(quoteText);
                    var newQuote = {id: id, author: quoteAuthor, quote: quoteText, vendor: 'brainy', quote_length: quoteText.length, times_published: 0};
                    console.log('Created quote: ');
                    console.log(newQuote);
                    results.push(newQuote);
                    lastQuoteText = quoteText;
                });

                operation.params.lastloadedid++;
                database.updateOperation(operation).then(() => {
                    resolve({status: 1, quotes: results, message: lastQuoteText});
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