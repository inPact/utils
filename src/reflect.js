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
     * Returns the line number from which this function was called
     * source: https://stackoverflow.com/questions/14172455/get-name-and-line-of-calling-function-in-node-js/14172822
     */
    getLineNumber() {
        return this.getCallingFrame(1).getLineNumber();
    },

    getCallingFunctionName() {
        return this.getCallingFrame(1).getFunctionName();
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