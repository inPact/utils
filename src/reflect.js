const path = require('path');
const util = require('util');

module.exports = {
    getCallStack() {
        let orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };

        let err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        let stack = err.stack;
        Error.prepareStackTrace = orig;

        return stack;
    },

    getPrintableStack() {
        let err = new Error;
        err.name = 'Trace';
        err.message = util.format.apply(this, arguments);
        Error.captureStackTrace(err, getPrintableStack);
        return err.stack;
    },

    /**
     * Returns the frame of the calling function or a different frame relative to the calling function.
     * @param frame - the relative frame: A positive number indicates a frame further back the call-stack from
     * the caller. I.e., 0 is the frame of the caller, 1 is the frame of the function that called the caller, etc.
     * @returns {CallSite}
     */
    getCallingFrame(frame = 0) {
        return this.getCallStack()[2 + frame];
    },

    /**
     * Returns the line number from which this function was called, or from a previous frame if specified.
     * source: https://stackoverflow.com/questions/14172455/get-name-and-line-of-calling-function-in-node-js/14172822
     * @param frame - further frames to go back if desired;
     */
    getLineNumber(frame = 0) {
        frame += 1;
        return this.getCallingFrame(frame).getLineNumber();
    },

    /**
     * Returns the file name from which this function was called, or from a previous frame if specified.
     * @param frame - further frames to go back if desired;
     */
    getFileName(frame = 0) {
        frame += 1;
        return this.getCallingFrame(frame).getFileName();
    },

    /**
     * Returns the name of the function from which this function was called, or from a previous frame if specified.
     * @param frame - further frames to go back if desired;
     */
    getCallingFunctionName(frame = 0) {
        frame += 1;
        return this.getCallingFrame(frame).getFunctionName();
    },

    /**
     * Returns the name of the function from which this function was called, or from a previous frame if specified.
     * @param frame - further frames to go back if desired;
     * @returns {string}
     */
    getCallingFunctionNameAndLocation(frame = 0) {
        frame += 1;
        const filepath = this.getFileName(frame);
        const filename = path.basename(filepath);
        const line = this.getLineNumber(frame);
        const name = this.getCallingFunctionName(frame);
        const location = `${filename}:${line}`;
        return name ? `${name} at ${location}` : location;
    },

    getMethodsNames(obj) {
        return Object.keys(obj).filter(key => typeof obj[key] === 'function');
    },

    getMethods(obj) {
        return this.getMethodsNames(obj).map(key => obj[key].toString());
    },

    getFunctionArguments(func) {
        let STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        let ARGUMENT_NAMES = /([^\s,]+)/g;
        let fnStr = func.toString().replace(STRIP_COMMENTS, '');
        let result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        return result === null ? [] : result;
    },

    countKeys(obj) {
        if (!obj)
            return 0;

        return Object.keys(obj).length;
    }
};