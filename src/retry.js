const logger = require('./logger');
const _ = require('lodash');

const promises = require('./promises');
const Promise = require('bluebird');

module.exports = class Retry {
    /*
     func: function to execute multiple times
     options:
     > retryErrorMatch: a function to run on encountered errors to determine whether or not to retry
     > retries: number of times to retry before giving up
     > maxTime: time in milliseconds after which to stop retrying
     > delay: time in milliseconds to wait between retries
     > printErrorStack: Verbosity of retry error
     > title: Prefix in case of retry error
     */
    constructor(func, options) {
        if (!options.retries && !options.maxTime)
            throw new Error(`either "retries" or "maxTime" options must be provided.`);

        this.func = func;
        this.options = _.assign({
            retries: Infinity,
            maxTime: Infinity,
            delay: 100,
            printErrorStack: true,
            title: '',
            retryErrorMatch: () => true
        }, options);

        this.options.title = this.options.title ? this.options.title += ': ' : '';
    }

    execute() {
        this.current = {
            start: Date.now(),
            attempt: 1
        };

        return promises.promiseWhile.call(this, () => !this.done, this.tryOne);
    }

    tryOne() {
        return Promise.resolve(this.func())
            .then(result => {
                this.done = true;
                return result;
            })
            .catch(e => {
                if (++this.current.attempt > this.options.retries ||
                    !this.options.retryErrorMatch(e) ||
                    (Date.now() - this.current.start) > this.options.maxTime)
                    throw e;

                let message = this.options.title +
                              `Retry attempt ${this.current.attempt} failed. Waiting ${this.options.delay}ms before next attempt`;

                if (this.options.printErrorStack)
                    message += ` Error: ${e.stack}, options: ${JSON.stringify(this.options)}`;

                logger.warn(message);
                return Promise.delay(this.options.delay);
            })
    }
};
