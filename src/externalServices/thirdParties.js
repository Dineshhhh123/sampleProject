'use strict';

let { thirdPartyAPI } = require('./../configs');
let { Rest } = require('../externalServices/axios-rest');
let fs = require('fs');

class ThirdPartyServices { }



async function sendRequestWithTimeout(apiCall, apiConfig, timeout) {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const response = await apiCall(apiConfig);
                resolve(response);
            } catch (err) {
                reject(err);
            }
        }, timeout);
    });
}


module.exports = { ThirdPartyServices };