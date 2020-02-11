const _ = require('lodash');
const ms = require('ms');
const emailRegEx = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,20}\b/;

module.exports = {
    stringify(obj) {
        return JSON.stringify(obj, null, 2);
    },

    stringifyArray(arr, joinString = '\r\n') {
        if (!arr || !arr.length)
            return '';

        return arr.map(x => JSON.stringify(x)).join(joinString);
    },

    stringifyWithFuncs(obj) {
        return JSON.stringify(obj, (key, val) => {
            if (typeof val === 'function')
                return val.name || (val.constructor && val.constructor.name);

            return val;
        }, 2);
    },

    stringifyInstances(arr, options = {}) {
        return this.stringifyArray(arr, {
            stringify: val => val.name || (val.constructor && val.constructor.name) || val,
            ...options
        });
    },

    stringifyOwn(obj) {
        return JSON.stringify(obj, Object.getOwnPropertyNames(obj), 2);
    },

    stringFormat(format) {
        var args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match;
        });
    },

    digitsOnly(s) {
        if (s) {
            return s.replace(/\D/g, '')
        }
    },

    /**
     * Trims a single instance of @target from the end of @string, if found.
     * If @target is an array, trims each one from @string (in order within array).
     * @param string - the string from which to trim
     * @param target - the string or strings to trim from @string
     * @returns {String} - @string with target(s) removed from end
     */
    trimEnd(string, target) {
        if (_.isArray(target))
            return target.reduce((s, t) => this.trimEnd(s, t), string);

        return _.endsWith(string, target) ? string.substring(0, string.length - target.length) : string;
    },

    /**
     * Join {@link strings} together using {@link separator}, removing any superfluous instances of
     * {@link separator} between strings.
     * @param separator
     * @param strings
     * @returns {string}
     */
    smartJoin(separator, ...strings) {
        return _(strings)
            .map((s, index) => {
                if (index === 0)
                    return _.trimEnd(s, separator);

                if (index === (strings.length - 1))
                    return _.trimStart(s, separator);

                return _.trim(s, separator);
            })
            .filter(x => x)
            .value()
            .join(separator);
    },

    camelCaseAll(object) {
        return _.mapKeys(object, (val, key) => _.camelCase(key));
    },

    camelToSpaceCase(cameled) {
        return (cameled || '').replace(/([A-Z])/g, ' $1');
    },

    pascalCase(str) {
        return _.capitalize(_.camelCase(str));
    },

    toUpperSnakeCase(str) {
        return _.snakeCase(str).toUpperCase();
    },

    isEmail(str) {
        return emailRegEx.test(str);
    },

    toMilliseconds(any) {
        return typeof any === 'number' ? any : ms(any);
    },

    smartSplit(str, separator = ',') {
        return (str || '').toString().split(separator).map(x => x.trim()).filter(x => x);
    }
};