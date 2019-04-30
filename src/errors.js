const _ = require('lodash');//.runInContext();
const logger = require('winston/lib/winston');

exports.formatError = function (e, options) {
    let error = logger.exception.getAllInfo(e);
    if (!options || options.trace !== true)
        delete error.trace;

    return error;
};

exports.errorToJsonObject = function (error) {
    if (!error) return error;
    if (typeof error === 'string') return { message: error };
    return _.assign({ error: error.toString(), message: error.message, stack: error.stack, code: error.code }, error);
};

exports.errorToString = function (error) {
    if (!error)
        return;

    let json = _.omit(_.assign({ error: error.toString(), message: error.message }, error), 'stack');
    let str = JSON.stringify(json, null, 2);
    return error.stack + '\r\nAdditional information: ' + str;
};