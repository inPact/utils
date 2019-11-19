const _ = require('lodash');
const extend = require('./src/extend'),
    entities = require('./src/entities'),
    errors = require('./src/errors'),
    promises = require('./src/promises'),
    strings = require('./src/strings'),
    fs = require('./src/fs'),
    math = require('./src/math'),
    reflect = require('./src/reflect'),
    trace = require('./src/mongoose_trace'),
    lock = require('./src/lock'),
    time = require('./src/time'),
    metrics = require("./src/metrics"),
    jaegerMiddleware = require("./src/jaegerMiddleware");

const self = {
    trace, lock, time, metrics, jaegerMiddleware,
    extend, entities, errors, promises, strings, fs, math, reflect,
    ...extend, ...entities, ...errors, ...promises, ...strings, ...fs, ...math, ...reflect
};

function buildMoredash() {
    let omit = _.functions(_).filter(funcName => funcName !== 'toString');
    return _.assign(_.runInContext(), _.omit(self, omit));
}

_.assign(self, {
    moredash: buildMoredash(),

    /**
     * Append additional functions to the utility and moredash wrappers (functions with identical names
     * will overrite existing functions)
     * @param obj {Object} - an object containing the functions and properties to append
     */
    use(obj) {
        _.assign(this, obj);
        this.moredash = buildMoredash();
        return this;
    }
});

module.exports = self;