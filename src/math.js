const _ = require('lodash');//.runInContext();

exports.centsToCurrency = function (cents) {
    return _.round(cents / 100, 2) || 0;
};

/**
 * Returns a new object with all numeric values converted to currency.
 * @param object
 * @param exclude {...String} - an array of properties to exclude from conversion
 * @returns {*}
 */
exports.allCentsToCurrency = function (object, ...exclude) {
    return _.transform(object, (res, val, key) =>
        res[key] = _.isNumber(val) && !exclude.some(x => x === key)
            ? this.centsToCurrency(val)
            : val);
};

// source: http://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
exports.randomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

exports.roundSafe = function (num, precision) {
    return num === Infinity ? 0 : (_.round(num, precision) || 0);
};

exports.hexToNumber = function (hex, digits = 6) {
    let multiplier = Math.pow(10, digits);
    let chars = 1 + digits;
    return parseInt(hex.toString().substr(-chars), 16) % multiplier;
};