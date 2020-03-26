const _ = require('lodash');
const Readable = require('stream').Readable;

module.exports = {
    mergeGroups(first, second, firstKey, secondKey) {
        return _.merge(first, second, (x, y) => {
            let val = {};
            val[firstKey] = x;
            val[secondKey] = y;

            return val;
        })
    },

    isNullOrEmpty(obj) {
        return obj === null || obj === undefined || obj === '';
    },

    /**
     * @Deprecated: Use _.transform, _.mapKeys, or _.mapValues
     *
     * Projects the values of each key in object by running them through projector.
     * @param object - the object whose values to project
     * @param valueProjector - a function that receives a value and returns the projected result.
     */
    mapObject(object, valueProjector) {
        return _.reduce(object, (res, val, key) => {
            res[key] = valueProjector(val, key, object);
            return res
        }, {});
    },

    isTrue(value) {
        if (value === true) return true;
        return value && (value.toString().toLowerCase() === 'true' || value.toString() === '1');
    },

    isFalse(value) {
        if (value === false) return true;
        return ((value !== null) && (undefined != value)) && (value.toString().toLowerCase() === 'false' || value.toString() === '0')
    },

    parseBoolean(value) {
        if (typeof value !== 'string')
            return Boolean(value);

        return value.toString().toLowerCase() === 'true';
    },

    removeDotsFromKeys(obj) {
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
    },

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
    project(source, oldToNewKeys, { includeAll } = {}) {
        if (includeAll)
            oldToNewKeys = _.merge({}, _.mapValues(source, () => 1), oldToNewKeys);

        let target = {};

        _.each(oldToNewKeys, (newPath, oldPath) => {
            let valueAtPath = _.get(source, oldPath);
            if (valueAtPath !== undefined)
                _.set(target, newPath === 1 ? oldPath : newPath, valueAtPath);
        });

        return target;
    },

    renameKey(source, key, newKey) {
        if (source[key] != null)
            source[newKey] = source[key];
        delete source[key];
    },

    renamePath(source, path, newPath) {
        if (path === newPath)
            return;

        let value = _.get(source, path);
        if (value) _.set(source, newPath, value);
        this.unset(source, path);
    },

    mergeClone(first, second) {
        return _.merge(_.clone(first), second);
    },

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
    traverse(obj, func, options = {}, { result = [], key, parent } = {}) {
        if (options.execObjects)
            traverseEntry(parent, obj, key, func, result, options);

        _.forIn(obj, (val, key) => {
            if (_.isArray(val))
                val.forEach(element => this.traverse(element, func, options, {
                    result: result,
                    key: key,
                    parent: obj
                }));

            else if (_.isObject(val))
                this.traverse(obj[key], func, options, { result: result, key: key, parent: obj });

            else
                traverseEntry(obj, val, key, func, result, options);
        });

        return result;
    },

    /**
     * Returns a new object constructed from running @func recursively on every property in @obj.
     * @param obj
     * @param func
     */
    mapDeep(obj, func) {
        obj = _.cloneDeep(obj);
        this.traverse(obj, func, { modifyObject: true });
        return obj;
    },

    /**
     * Moves properties from @source to @target by running @picker on source and merging the result into @target.
     * Both source and target are modified by this method.
     * @param source - the source object form which to move.
     * @param target - the target object into which to merge the picked properties.
     * @param picker - see lodash docs for _.pick
     */
    moveProperties(source, target, picker) {
        let properties = _.pick(source, picker);
        _.merge(target, properties);
        _.forOwn(properties, (val, key) => delete source[key]);
    },

    /**
     * Pulls properties from @source by running @picker on source. Matched properties are removed from @source
     * and returned as an object.
     * @param source - the source object form which to move.
     * @param picker - see lodash docs for _.pick
     */
    pullProperties(source, ...properties) {
        let result = {};
        this.moveProperties(source, result, properties);
        return result;
    },

    /**
     * Returns a new object with the elements from @source that match @predicate.
     * @param source -- the object to filter
     * @param predicate -- a predicate that takes two arguments: value and key; and returns true if the pair
     * should be returned in the result, or false if they should be filtered out.
     */
    filterObject(source, predicate) {
        return _.reduce(source, (res, val, key) => {
            if (predicate(val, key))
                res[key] = val;
            return res;
        }, {})
    },

    isEmptyRecursive(object) {
        if (_.isEmpty(object))
            return true;

        return _.every(this.traverse(object, val => val == null));
    },

    /**
     * Removes the property at path of object.
     * Replace with losash function once move to v4
     * @param object {Object} - The object to modify.
     * @param path {String} - The path of the property to unset.
     */
    unset(object, path) {
        let pParts = path.split('.');
        let fParts = pParts.slice(0, pParts.length - 1);
        let prop = pParts[pParts.length - 1];
        if (fParts.length)
            object = _.get(object, fParts.join(0));
        delete object[prop];
    },

    /**
     * Flatten javascript objects into a single-depth object (from https://gist.github.com/penguinboy/762197)
     * Arrays in the object are not modified.
     * @param obj - object to flatten
     */
    flattenObject(obj) {
        if (!_isIterable(obj))
            return obj;

        const result = {};
        for (let prop in obj) {
            if (!obj.hasOwnProperty(prop))
                continue;

            if (_.isPlainObject(obj[prop])) {
                let flatObject = this.flattenObject(obj[prop]);
                for (let subProp in flatObject) {
                    if (!flatObject.hasOwnProperty(subProp))
                        continue;

                    result[`${prop}.${subProp}`] = flatObject[subProp];
                }
            } else {
                result[`${prop}`] = obj[prop];
            }
        }
        return result;
    },

    /**
     * Returns the intersection of the common keys of two objects;
     * @param first {Object}
     * @param second {Object}
     * @returns {Array.<*>} - an array of the keys that exist in both @first and @second
     */
    intersectKeys(first, second) {
        return Object.keys(first).filter({}.hasOwnProperty.bind(second));
    },

    /**
     * Same as lodash "isMatch" function, but with support for nulls, undefined, and non-objects.
     * @param first
     * @param second
     * @returns {boolean}
     */
    areEqual(first, second) {
        if (first == null && second == null)
            return true;

        if (first == null || second == null)
            return false;

        if (_.isObject(first) && _.isObject(second))
            return _.isMatch(first, second);

        return first === second;

    },

    /**
     * A VERY naive implementation of converting a string to a stream, by adding the entire contents
     * as a single chunk.
     * @param contents
     */
    toStream(contents) {
        let stream = new Readable();
        stream.push(contents);
        stream.push(null);

        return stream;
    },

    /**
     * Clone using JSON
     * @param source
     */
    cloneDeepByJSON(source) {
        return JSON.parse(JSON.stringify(source));
    },

    /**
     * Same as lodash "pick", only with list of property paths rather then properties.
     * @param source: The object to pick from.
     * @param paths: spread list of paths, like 'prop1','prop2.subProp1'
     */
    pickDeep(source, ...paths) {
        return paths.reduce((result, path) => {
            let val = _.get(source, path);
            if (val != null)
                _.set(result, path, _.get(source, path));

            return result;
        }, {});
    },

    /**
     * Similar as lodash 4 toString.
     * See: https://lodash.com/docs/4.17.10#toString
     * TODO: remove after lodash upgrade
     * @param value
     */
    toString(value) {
        return (value == null) ? '' : baseToString(value);
    },

    /**
     * Deep diff between two object, using lodash
     * @param  {Object} first - Object compared
     * @param  {Object} second - Object to compare with
     * @return {Object} Returns a new object representing the keys that are different and their original values
     * source: https://gist.github.com/Yimiprod/7ee176597fef230d1451
     */
    diff(first, second) {
        if (!first) return second;
        if (!second) return first;
        return _.transform(first, (result, value, key) => {
            if (!_.isEqual(value, second[key]))
                result[key] = _.isObject(value) && _.isObject(second[key]) ? this.diff(value, second[key]) : value;
        }, {});
    },

    /**
     * check if object are different
     * @param  {Object} first - Object compared
     * @param  {Object} second - Object to compare with
     * @return {Object} Returns if first and second are different
     */
    hasDiff(first, second) {
        return !this.isEmptyRecursive(this.diff(first, second));
    },

    /**
     * Gets the first path that yields a non-null, non-undefined value using _.get functionality.
     * @param object
     * @param paths
     */
    getFirst(object, ...paths) {
        for (let i = 0; i < paths.length; i++) {
            let val = _.get(object, paths[i]);
            if (val != null)
                return val;
        }
    }
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

function _isIterable(obj) {
    return _.isPlainObject(obj) || _.isArray(obj);
}

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