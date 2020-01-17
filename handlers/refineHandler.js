/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const database = require('../database');

module.exports = {
    refine(data) {
        return new Promise((resolve, reject) => {
            var promises = [];
            for (const refinement of data.refinements) {
                promises.push(database.refineByUpdate(refinement));
            }

            Promise.all(promises).then((allResults) => {
                var cnt = 0;
                for (const r of allResults) {
                    cnt += parseInt(r);
                }
                resolve(`Refined ${cnt} quotes`);
            }).catch((e) => {
                reject(e);
            });
        });
    },
    calculateLengths() {
        return new Promise((resolve, reject) => {
            database.setQuotesLenghtByBatch().then((result) => {
                resolve(`${result} quotes refined`);
            }).catch((e) => {
                reject(e);
            });
        });
    }
};