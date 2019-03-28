const debug = require('debug');
const mongoose = require('mongoose');

module.exports = {
    async runWithDebug(namespace, func) {
        if (typeof namespace === 'function')
            namespace = namespace.namespace;

        if (!debug.enabled(namespace) || !debug.enabled('ros:trace:mongo'))
            return func();

        const wasEnabled = mongoose.get('debug');
        try {
            debug(namespace)(`TRACE: activating mongoose debug`);
            mongoose.set('debug', true);
            return await func();
        } finally {
            debug(namespace)(`TRACE: disabling mongoose debug`);
            mongoose.set('debug', wasEnabled);
        }
    }
};