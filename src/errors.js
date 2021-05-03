const _ = require('lodash');//.runInContext();

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