/*jslint node: true */
/*jshint esversion: 6 */
'use strict';

const database = require('../database');

module.exports = {
    autoRefine() {
        return new Promise((resolve, reject) => {
            database.getOldestOperation('refiner').then((operation) => {

                database.refineByUpdate({
                    target: operation.params.targetfield,
                    targetValue: operation.params.targetvalue,
                    condition: operation.params.idfield,
                    conditionValue: operation.params.idfieldvalue
                }).then((result) => {
                    database.updateOperation(operation).then(() => {
                        resolve(`Refined ${result} quotes with condition ${operation.params.idfield} on operation ${operation.name}`);
                    }).catch((e) => {
                        reject(e);
                    });
                }).catch((e) => {
                    reject(e);
                });
            }).catch((e) => {
                reject(e);
            });
        });
    },
    /**
     * DEPRECATED
     * @param {Object} data
     */
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
    },
    setTimesPublished() {
        return new Promise((resolve, reject) => {
            database.setQuotesTimesPublishedByBatch().then((result) => {
                resolve(`${result} quotes refined`);
            }).catch((e) => {
                reject(e);
            });
        });
    }
};