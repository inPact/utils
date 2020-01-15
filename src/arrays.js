const _ = require('lodash');
const Readable = require('stream').Readable;

module.exports = {
    /**
     * Create hash-table from array of objects
     * @param {Array} array - the array to convert
     * @param {String|Function} key - the name of the key property, or function that calculate the key
     * @param {Function} [projection] - function to calculate the value of the hash-table. id omitted, the original array entry used as is
     * @return {*}
     */
    toHashtable(array, key, projection) {
        return _.reduce(array, (table, item) => {
            let propName;
            if ((typeof key) === 'function')
                propName = key(item);
            else if ((typeof key) === 'string')
                propName = item[key];
            else
                throw new Error('key must be a string or a function');

            table[propName] = projection ? projection(item) : item;
            return table;
        }, {});
    },

    groupIntoPairs(array, keyTransformer) {
        return _(array)
            .groupBy(keyTransformer)
            .map((val, key) => {
                return { key: key, value: val.map(x => x) }
            })
            .value();
    },

    getTopElement(array, comparison) {
        comparison = comparison || ((a, b) => a - b);
        return _.reduce(array, (result, value) => {
            if (!result) return value;
            if (comparison(value, result) > 0) return value;
            return result;
        })
    },

    /**
     * Returns a new array which is the result of merging {@param arrays} using {@param key} to match elements.
     * The order of {@param arrays} determines the priority of merged properties, i.e., subsequent elements override
     * previous elements.
     * NOTE: When merging two arrays that have the same length and order, use _.merge instead.
     * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
     * @param arrays {...Array<Object>}
     * @returns {Array<Object>}
     */
    mergeArrays(key, ...arrays) {
        return this.mergeArraysWith(key, null, ...arrays);
    },

    /**
     * Returns a new object whose keys are merged from @objects
     * and whose values follow normal lodash merge behavior except for numbers of fields that exist in multiple objects,
     * in which case those values are summed.
     * @param {Array<Object>|...Object|...Array<Array<Object>>} objects -- the objects to sum
     */
    sumObjects(...objects) {
        return _.merge({}, ...objects, sumNumbers)
    },

    /**
     * Merges all arrays into the first passed array, following normal lodash merge behavior except for
     * numbers of fields that exist in multiple objects, in which case those values are summed.
     * @param arrays {Array.<Array.<Object>>}
     * @returns {Array.<Object>}
     */
    sumArrays(...arrays) {
        return _.merge(...arrays, sumNumbers)
    },

    /**
     * Same as {@link this.sumObjects} but returns an array that sums all numeric value in arrays,
     * merging array elements by @key.
     * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
     * @param arrays {Array.<Array.<Object>>}
     * @returns {Array.<Object>}
     */
    sumArraysBy(key, ...arrays) {
        return this.mergeArraysWith(key, sumNumbers, ...arrays);
    },

    /**
     * Same as {@link this.sumArrays} but excludes fields @excludedProps from being summed.
     * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
     * @param arrays {Array.<Array.<Object>>}
     * @returns {Array.<Object>}
     */
    sumArraysExcept(key, excludedProps, ...arrays) {
        return this.mergeArraysWith(key, (x, y, elementKey) => {
            if (_.isNumber(x) && _.isNumber(y) && !excludedProps.some(prop => prop === elementKey))
                return x + y;
        }, ...arrays);
    },

    /**
     * Returns a new array which is the result of merging {@param arrays} using {@param key} to match elements, and
     * {@param customizer} to merge elements.
     * The order of {@param arrays} determines the priority of merged properties, i.e., subsequent elements override
     * previous elements.
     * NOTE: When merging two arrays that have the same length and order, use _.merge instead.
     * NOTE: When a customizer is not needed, use {@link mergeArrays} instead.
     * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
     * @param customizer {Function} - lodash customizer function
     * @param arrays {...Array<Object>}
     * @returns {Array<Object>}
     */
    mergeArraysWith(key, customizer, ...arrays) {
        let maps = _(arrays)
            .filter(x => x && x.length)
            .map(x => this.toHashtable(x, key))
            .value();

        return _({}).merge(...maps, customizer).values().value();
    },

    /**
     * Returns a new array which is the result of appending or merging elements in {@param second} to the intersection
     * of {@param second} and {@param first}, using {@param key} to match elements.
     * I.e., elements in {@param first} that do not appear in {@param second} are excluded from the result.
     * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
     * @param first {Array<Object>}
     * @param second {Array<Object>}
     * @param [nullToUndefined] {Boolean} - true to assign null values as undefined.
     * @returns {Array<Object>}
     */
    assignOrAppend(key, first, second, { nullToUndefined = false } = {}) {
        let firstMap = this.toHashtable(first, key);
        let secondMap = this.toHashtable(second, key);
        let intersection = this.intersectKeys(firstMap, secondMap);
        firstMap = _.pick(firstMap, intersection);

        let customizer = nullToUndefined
            ? (first, second) => second === null ? undefined : second
            : undefined;

        return second.map(entry => _.assign({}, firstMap[entry[key]], entry, customizer));
    },

    /**
     * Locates elements in {@param targetSet} based on associations defined in {@param associations}, using
     * the {@param locator} to map each association to an element in {@param targetSet}.
     * @param targetSet {Array}
     * @param associations {Array}
     * @param locator {Function}
     * @returns {Array}
     */
    locateMany(targetSet, associations, locator) {
        let results = [];

        associations.forEach(association => {
            let targets = locator(targetSet, association);
            if (targets)
                results = results.concat(targets);
        });

        return results;
    },

    /**
     * replace element {@param replacement} in {@param array} using {@param matcher}
     * @param array
     * @param replacement
     * @param matcher {String|Function} - if a string is provided, will be used as the property in {@param replacement}
     * to match against.
     * @returns {number} - the index of the replaced element, or -1 if no element was found.
     */
    replaceElementBy(array, replacement, matcher) {
        if (!array || !array.length)
            return -1;

        if (typeof matcher === 'string') {
            let prop = matcher;
            matcher = entry => entry[prop] === replacement[prop];
        }

        let index = _.findIndex(array, matcher);
        if (index > -1)
            array[index] = replacement;

        return index;
    },

    replaceOrAddBy(arr, entry, property) {
        if (!arr || !arr.length)
            return;

        let result = this.replaceElementBy(arr, entry, property);
        if (result < 0)
            arr.push(entry);
    },

    /**
     * Adds {@param entry} to {@param array} if an identical element doesn't already exist.
     * @param array
     * @param entry
     */
    addToSet(array, entry) {
        if (!array)
            return;

        if (!_.find(array, x => _.isEqual(x, entry)))
            array.push(entry);
    }
};

function sumNumbers(x, y, key) {
    if (_.isNumber(x) && _.isNumber(y))
        return x + y;
}