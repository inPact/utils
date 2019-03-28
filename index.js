const _ = require('lodash');
const Readable = require('stream').Readable;
const externalUtils = {
    trace: require('./mongoose_trace'),
    lock: require('./lock'),
};

_.assign(this,
    require('./entities'),
    require('./errors'),
    require('./promises'),
    require('./strings'),
    require('./fs'),
    require('./math'),
    require('./reflect'), externalUtils);

/**
 * Create hash-table from array of objects
 * @param {Array} array - the array to convert
 * @param {String|Function} key - the name of the key property, or function that calculate the key
 * @param {Function} [projection] - function to calculate the value of the hash-table. id omitted, the original array entry used as is
 * @return {*}
 */
exports.toHashtable = function (array, key, projection) {
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
};

exports.groupIntoPairs = function (array, keyTransformer) {
    return _(array)
        .groupBy(keyTransformer)
        .map((val, key) => {
            return { key: key, value: val.map(x => x) }
        })
        .value();
};

exports.mergeGroups = function (first, second, firstKey, secondKey) {
    return _.merge(first, second, (x, y) => {
        let val = {};
        val[firstKey] = x;
        val[secondKey] = y;

        return val;
    })
};

exports.isNullOrEmpty = function (obj) {
    return obj === null || obj === undefined || obj === '';
};

exports.getTopElement = function (array, comparison) {
    comparison = comparison || ((a, b) => a - b);
    return _.reduce(array, (result, value) => {
        if (!result) return value;
        if (comparison(value, result) > 0) return value;
        return result;
    })
};

/**
 * @Deprecated: Use _.transform, _.mapKeys, or _.mapValues
 *
 * Projects the values of each key in object by running them through projector.
 * @param object - the object whose values to project
 * @param valueProjector - a function that receives a value and returns the projected result.
 */
exports.mapObject = function (object, valueProjector) {
    return _.reduce(object, (res, val, key) => {
        res[key] = valueProjector(val, key, object);
        return res
    }, {});
};

exports.isTrue = function (value) {
    if (value === true) return true;
    return value && (value.toString().toLowerCase() === 'true' || value.toString() === '1');
};

exports.isFalse = function (value) {
    if (value === false) return true;
    return ((value !== null) && (undefined != value)) && (value.toString().toLowerCase() === 'false' || value.toString() === '0')
};

exports.parseBoolean = function (value) {
    if (typeof value !== 'string')
        return Boolean(value);

    return value.toString().toLowerCase() === 'true';
};

exports.removeDotsFromKeys = function (obj) {
    if (_.isArray(obj)) return obj.map(o => this.removeDotsFromKeys(o));
    if (!_.isPlainObject(obj) && !(obj instanceof Error)) return obj;
    _.keys(obj).forEach(k => {
        obj[k] = this.removeDotsFromKeys(obj[k]);
        if (k.indexOf('.') >= 0) {
            let prepK = k.split('.').join('-dot-');
            obj[prepK] = obj[k];
            delete obj[k];
        }
    });
    return obj;
};

/**
 * Returns a new object with keys from {target} mapped according to the mapping defined in {oldToNewKeys}.
 * Supports any valid JSON notation (see lodash _.get and _.set) on both the source
 * and target keys, so that nested or array values on {target} can be flattened or
 * moved and vice-versa.
 * Use target value of 1 to include the field as is (without mapping).
 * This method does not modify {source}.
 * @param source
 * @param oldToNewKeys
 * @param includeAll {Boolean} - true to map any properties in {@param source} that are not explicitly
 * defined in {@param oldToNewKeys};
 * @returns {*} -- target with keys remapped.
 */
exports.project = function (source, oldToNewKeys, { includeAll } = {}) {
    if (includeAll)
        oldToNewKeys = _.merge({}, _.mapValues(source, () => 1), oldToNewKeys);

    let target = {};

    _.each(oldToNewKeys, (newPath, oldPath) => {
        let valueAtPath = _.get(source, oldPath);
        if (valueAtPath !== undefined)
            _.set(target, newPath === 1 ? oldPath : newPath, valueAtPath);
    });

    return target;
};

exports.renameKey = function (source, key, newKey) {
    if (source[key] != null)
        source[newKey] = source[key];
    delete source[key];
};

exports.renamePath = function (source, path, newPath) {
    if (path === newPath)
        return;

    let value = _.get(source, path);
    if (value) _.set(source, newPath, value);
    this.unset(source, path);
};

exports.mergeClone = function (first, second) {
    return _.merge(_.clone(first), second);
};

/**
 * Traverses the graph of @obj and runs @func on each leaf element.
 * Returns an array containing all values (if any) returned by running @func on each leaf element.
 * @param obj
 * @param func -- a function to invoke on each element of object, that is invoked with 3 arguments:
 * the element value, the element key, and the parent element that is currently being traversed.
 * @param [options.execObjects] {Boolean} - true to send objects to @func. By default only low-level properties
 * are sent to @func.
 * @param [options.modifyObject] {Boolean} - true to update source @obj with results of @func. Defaults to false.
 * @param [options]
 * @param result -- (for internal use) an array to which to append results or null to add to a new array.
 * @param key -- for internal use only
 * @param parent -- for internal use only
 */
exports.traverse = function (obj, func, options = {}, { result = [], key, parent } = {}) {
    if (options.execObjects)
        traverseEntry(parent, obj, key, func, result, options);

    _.forIn(obj, (val, key) => {
        if (_.isArray(val))
            val.forEach(element => this.traverse(element, func, options, { result: result, key: key, parent: obj }));

        else if (_.isObject(val))
            this.traverse(obj[key], func, options, { result: result, key: key, parent: obj });

        else
            traverseEntry(obj, val, key, func, result, options);
    });

    return result;
};

function traverseEntry(obj, val, key, func, result, { modifyObject } = {}) {
    let res = func(val, key, obj);

    if (res != null) {
        if (modifyObject && key && obj)
            obj[key] = res;
        else
            result.push(res);
    }

    return res;
}

/**
 * Returns a new object constructed from running @func recursively on every property in @obj.
 * @param obj
 * @param func
 */
exports.mapDeep = function (obj, func) {
    obj = _.cloneDeep(obj);
    this.traverse(obj, func, { modifyObject: true });
    return obj;
};

/**
 * Moves properties from @source to @target by running @picker on source and merging the result into @target.
 * Both source and target are modified by this method.
 * @param source - the source object form which to move.
 * @param target - the target object into which to merge the picked properties.
 * @param picker - see lodash docs for _.pick
 */
exports.moveProperties = function (source, target, picker) {
    let properties = _.pick(source, picker);
    _.merge(target, properties);
    _.forOwn(properties, (val, key) => delete source[key]);
};

/**
 * Pulls properties from @source by running @picker on source. Matched properties are removed from @source
 * and returned as an object.
 * @param source - the source object form which to move.
 * @param picker - see lodash docs for _.pick
 */
exports.pullProperties = function (source, ...properties) {
    let result = {};
    this.moveProperties(source, result, properties);
    return result;
};

/**
 * Returns a new object with the elements from @source that match @predicate.
 * @param source -- the object to filter
 * @param predicate -- a predicate that takes two arguments: value and key; and returns true if the pair
 * should be returned in the result, or false if they should be filtered out.
 */
exports.filterObject = function (source, predicate) {
    return _.reduce(source, (res, val, key) => {
        if (predicate(val, key))
            res[key] = val;
        return res;
    }, {})
};

/**
 * Returns a new array which is the result of merging {@param arrays} using {@param key} to match elements.
 * The order of {@param arrays} determines the priority of merged properties, i.e., subsequent elements override
 * previous elements.
 * NOTE: When merging two arrays that have the same length and order, use _.merge instead.
 * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
 * @param arrays {...Array<Object>}
 * @returns {Array<Object>}
 */
exports.mergeArrays = function (key, ...arrays) {
    return this.mergeArraysWith(key, null, ...arrays);
};

function sumNumbers(x, y, key) {
    if (_.isNumber(x) && _.isNumber(y))
        return x + y;
}

/**
 * Returns a new object whose keys are merged from @objects
 * and whose values follow normal lodash merge behavior except for numbers of fields that exist in multiple objects,
 * in which case those values are summed.
 * @param {Array<Object>|...Object|...Array<Array<Object>>} objects -- the objects to sum
 */
exports.sumObjects = function (...objects) {
    return _.merge({}, ...objects, sumNumbers)
};

/**
 * Merges all arrays into the first passed array, following normal lodash merge behavior except for
 * numbers of fields that exist in multiple objects, in which case those values are summed.
 * @param arrays {Array.<Array.<Object>>}
 * @returns {Array.<Object>}
 */
exports.sumArrays = function (...arrays) {
    return _.merge(...arrays, sumNumbers)
};

/**
 * Same as {@link this.sumObjects} but returns an array that sums all numeric value in arrays,
 * merging array elements by @key.
 * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
 * @param arrays {Array.<Array.<Object>>}
 * @returns {Array.<Object>}
 */
exports.sumArraysBy = function (key, ...arrays) {
    return this.mergeArraysWith(key, sumNumbers, ...arrays);
};

/**
 * Same as {@link this.sumArrays} but excludes fields @excludedProps from being summed.
 * @param key {String|Function} -- the key by which to match and merge individual elements within each array in @arrays
 * @param arrays {Array.<Array.<Object>>}
 * @returns {Array.<Object>}
 */
exports.sumArraysExcept = function (key, excludedProps, ...arrays) {
    return this.mergeArraysWith(key, (x, y, elementKey) => {
        if (_.isNumber(x) && _.isNumber(y) && !excludedProps.some(prop => prop === elementKey))
            return x + y;
    }, ...arrays);
};

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
exports.mergeArraysWith = function (key, customizer, ...arrays) {
    let maps = _(arrays)
        .filter(x => x && x.length)
        .map(x => this.toHashtable(x, key))
        .value();

    return _({}).merge(...maps, customizer).values().value();
};

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
exports.assignOrAppend = function (key, first, second, { nullToUndefined = false } = {}) {
    let firstMap = this.toHashtable(first, key);
    let secondMap = this.toHashtable(second, key);
    let intersection = this.intersectKeys(firstMap, secondMap);
    firstMap = _.pick(firstMap, intersection);

    let customizer = nullToUndefined
        ? (first, second) => second === null ? undefined : second
        : undefined;

    return second.map(entry => _.assign({}, firstMap[entry[key]], entry, customizer));
};

exports.isEmptyRecursive = function (object) {
    if (_.isEmpty(object))
        return true;

    return _.every(this.traverse(object, val => val == null));
};

/**
 * Removes the property at path of object.
 * Replace with losash function once move to v4
 * @param object {Object} - The object to modify.
 * @param path {String} - The path of the property to unset.
 */
exports.unset = function (object, path) {
    let pParts = path.split('.');
    let fParts = pParts.slice(0, pParts.length - 1);
    let prop = pParts[pParts.length - 1];
    if (fParts.length)
        object = _.get(object, fParts.join(0));
    delete object[prop];
};

/**
 * Flatten javascript objects into a single-depth object (from https://gist.github.com/penguinboy/762197)
 * @param obj - object to flatten
 */
exports.flattenObject = function (obj) {
    let toReturn = {};
    for (let prop in obj) {
        if (!obj.hasOwnProperty(prop)) continue;

        if (_.isPlainObject(obj[prop])) {
            let flatObject = this.flattenObject(obj[prop]);
            for (let subProp in flatObject) {
                if (!flatObject.hasOwnProperty(subProp)) continue;

                toReturn[prop + '.' + subProp] = flatObject[subProp];
            }
        } else {
            toReturn[prop] = obj[prop];
        }
    }
    return toReturn;
};

/**
 * Returns the intersection of the common keys of two objects;
 * @param first {Object}
 * @param second {Object}
 * @returns {Array.<*>} - an array of the keys that exist in both @first and @second
 */
exports.intersectKeys = function (first, second) {
    return Object.keys(first).filter({}.hasOwnProperty.bind(second));
};

/**
 * Same as lodash "isMatch" function, but with support for nulls, undefined, and non-objects.
 * @param first
 * @param second
 * @returns {boolean}
 */
exports.areEqual = function (first, second) {
    if (first == null && second == null)
        return true;

    if (first == null || second == null)
        return false;

    if (_.isObject(first) && _.isObject(second))
        return _.isMatch(first, second);

    return first === second;

};

/**
 * A VERY naive implementation of converting a string to a stream, by adding the entire contents
 * as a single chunk.
 * @param contents
 */
exports.toStream = function (contents) {
    let stream = new Readable();
    stream.push(contents);
    stream.push(null);

    return stream;
};

/**
 * Clone using JSON
 * @param source
 */
exports.cloneDeepByJSON = function (source) {
    return JSON.parse(JSON.stringify(source));
};

/**
 * Same as lodash "pick", only with list of property paths rather then properties.
 * @param source: The object to pick from.
 * @param paths: spread list of paths, like 'prop1','prop2.subProp1'
 */
exports.pickDeep = function (source, ...paths) {
    return paths.reduce((result, path) => {
        let val = _.get(source, path);
        if (val != null)
            _.set(result, path, _.get(source, path));

        return result;
    }, {});
};

/**
 * Similar as lodash 4 toString.
 * See: https://lodash.com/docs/4.17.10#toString
 * TODO: remove after lodash upgrade
 * @param value
 */
exports.toString = function (value) {
    return (value == null) ? '' : baseToString(value);
};

function baseToString(value) {
    if (typeof value == 'string') {
        return value;
    }
    if (_.isArray(value)) {
        // Recursively convert values (susceptible to call stack limits).
        return value.map(baseToString) + '';
    }
    let result = (value + '');
    return (result == '0' && (1 / value) == -Infinity) ? '-0' : result;
}

/**
 * Locates elements in {@param targetSet} based on associations defined in {@param associations}, using
 * the {@param locator} to map each association to an element in {@param targetSet}.
 * @param targetSet {Array}
 * @param associations {Array}
 * @param locator {Function}
 * @returns {Array}
 */
exports.locateMany = function (targetSet, associations, locator) {
    let results = [];

    associations.forEach(association => {
        let targets = locator(targetSet, association);
        if (targets)
            results = results.concat(targets);
    });

    return results;
};

/**
 * Deep diff between two object, using lodash
 * @param  {Object} first - Object compared
 * @param  {Object} second - Object to compare with
 * @return {Object} Returns a new object representing the keys that are different and their original values
 * source: https://gist.github.com/Yimiprod/7ee176597fef230d1451
 */
exports.diff = function difference(first, second) {
    return _.transform(first, (result, value, key) => {
        if (!_.isEqual(value, second[key]))
            result[key] = _.isObject(value) && _.isObject(second[key]) ? this.diff(value, second[key]) : value;
    });
};

// leave this line last
let omit = _.functions(_).filter(funcName => funcName !== 'toString');
exports.moredash = _.assign(_.runInContext().mixin(_.omit(this, omit)), externalUtils);
