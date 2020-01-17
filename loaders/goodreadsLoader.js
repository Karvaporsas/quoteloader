/*jslint node: true */
/*jshint esversion: 6 */
'use strict';
const rp = require('request-promise');
const cheerio = require('cheerio');
const utils = require('./../utils');
const database = require('./../database');
const DEBUG_MODE = process.env.DEBUG_MODE === 'ON';

module.exports = {
    load(data, resolve, reject) {
        if (DEBUG_MODE) {
            console.log(data);
        }

        database.getLoaderOptions(data.utilsName).then((loaderOptions) => {
            if (loaderOptions.last_loaded_page === loaderOptions.max_pages) {
                reject({message: 'Everything loaded already'});
                return;
            }
            const page = loaderOptions.last_loaded_page + 1;
            var options = {
                method: 'GET',
                url: `https://www.goodreads.com/author/quotes/${loaderOptions.url_identifier}?page=${page}`
            };
            loaderOptions.last_loaded_page++;
            rp(options, (error, response, body) => {
                if (error) {
                    console.log('Error getting quotes');
                    console.log(error);
                    reject(error);
                } else {
                    var results = [];
                    const $ = cheerio.load(body);
                    const quotes = $('.quoteText');

                    quotes.each(function (i, elem) {
                        var quoteText = $(this).text().trim();
                        var quoteAuthor = $(this).children('.authorOrTitle').text().replace(',', '').trim();
                        //Quote has quotation marks around it and propably something unwanted after last. Getting rid of those
                        const firstMark = quoteText.indexOf('“');
                        const lastMark = quoteText.lastIndexOf('”');
                        if (firstMark === 0 && firstMark !== lastMark) {
                            quoteText = quoteText.substring(firstMark + 1, lastMark);
                        }
                        var id = utils.createHash(quoteText);
                        results.push({id: id, author: quoteAuthor, quote: quoteText, vendor: 'goodreads', quote_length: quoteText.length});
                    });
                    database.updateLoaderOptions(loaderOptions).then(() => {
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
        }).catch((e) => {
            reject(e);
        });


    }
};