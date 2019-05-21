const _ = require('lodash');//.runInContext();

module.exports = {
    centsToCurrency(cents) {
        return _.round(cents / 100, 2) || 0;
    },

    /**
     * Returns a new object with all numeric values converted to currency.
     * @param object
     * @param exclude {...String} - an array of properties to exclude from conversion
     * @returns {*}
     */
    allCentsToCurrency(object, ...exclude) {
        return _.transform(object, (res, val, key) =>
            res[key] = _.isNumber(val) && !exclude.some(x => x === key)
                ? this.centsToCurrency(val)
                : val);
    },

    // source: http://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    },

    roundSafe(num, precision) {
        return num === Infinity ? 0 : (_.round(num, precision) || 0);
    },

    hexToNumber(hex, digits = 6) {
        let multiplier = Math.pow(10, digits);
        let chars = 1 + digits;
        return parseInt(hex.toString().substr(-chars), 16) % multiplier;
    },

    /**
     * This is basically the lodash v3 _.sum function which was broken in lodash v4. It sums values that
     * can be summed, silently ignoring non-summable values.
     * @param collection {Array|Object|string} - The collection to iterate over
     * @param [iteratee] {Function|Object|string} - The function invoked per iteration
     */
    sumSafe(collection, iteratee) {
        let safeIteratee = iteratee
            ? x => {
                let res = iteratee(x);
                return (isNaN(res) ? 0 : Number(res))
            }
            : x => isNaN(x) ? 0 : Number(x);

        return _.sumBy(collection, safeIteratee);
    }
};
