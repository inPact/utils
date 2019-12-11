const Promise = require('bluebird');
const lock = new (require('async-lock'))({ Promise: Promise, maxPending: 5000 });
const debug = require('debug')('tabit:utils');
const randomstring = require('randomstring');
const logger = require('winston');

const MIN_LOCKS_FOR_DEBUG = process.env.MIN_DOUBLE_CHECK_LOCKS_FOR_DEBUG || 100;
let pendingCounter = 0;
let lockedCounter = 0;

async function getOrInitAndSet(getter, initializer, setter) {
    let val = await getter();
    if (val)
        return val;

    val = await initializer();
    await setter(val);

    return val;
}

function debugLocking(lockName) {
    let id = '';
    if (debug.enabled) {
        pendingCounter++;
        if (pendingCounter >= MIN_LOCKS_FOR_DEBUG) {
            id = randomstring.generate({ length: 6, charset: 'alphabetic' });
            debug(`Double-check-lock ${id}: acquiring lock on ${lockName}. Total pending locks: ${pendingCounter}`);
        }
    }
    return id;
}

function debugLockAcquired(id, lockName) {
    if (debug.enabled) {
        lockedCounter++;
        pendingCounter--;
        if (id)
            debug(`Double-check-lock ${id}: lock acquired on ${lockName}. Total open/pending locks: ${lockedCounter}/${pendingCounter}`);
    }
}

function debugLockReleased(id, lockName) {
    if (debug.enabled) {
        lockedCounter--;
        if (id)
            debug(`Double-check-lock ${id}: lock released on ${lockName}. Total open locks: ${lockedCounter}`);
    }
}

/**
 * Lazy loads a resource using a double-check lock pattern.
 * @param getter {Function} - a function that returns the resource that will be returned if it has already been loaded
 * @param namespace {String} - an arbitrary but unique namespace to lock against. Subsequent locks with the same
 * namespace will be queued until previous requests have completed.
 * @param initializer {Function} - a function that loads the resource if getter returns a Falsey value
 * @param setter {Function} - a function that saves the resource so that it is returned by {@link getter} the next time
 * it is requested.
 * @returns {Promise.<T>} - the resource returned by getter or initializer
 */
module.exports = {
    internal: lock,

    get traceCounter() {
        return pendingCounter;
    },

    async getWithDoubleCheck(getter, namespace, initializer, setter) {
        let val = await getter();
        if (val)
            return val;

        return this.acquire(namespace, () => getOrInitAndSet(getter, initializer, setter));
    },

    /**
     * Executes an action with single-thread concurrency-protection. If the concurrency-protection fails this method
     * ensures that {@param action} is still invoked (but without single-thread concurrency-protection).
     * @param namespace {String} - an arbitrary but unique namespace to lock against. Subsequent locks with the same
     * namespace will be queued until previous requests have completed.
     * it is requested.
     * @param action {Function} - a function to execute once the lock is acquired.
     * @returns {Promise.<T>} - the resource, if any, returned by {@param action}
     */
    async acquire(namespace, action) {
        let lockId = debugLocking(namespace);
        try {
            let result = await lock.acquire(namespace, async () => {
                debugLockAcquired(lockId, namespace);
                return await action();
            });
            debugLockReleased(lockId, namespace);
            return result;
        } catch (e) {
            if (e.message === 'Too much pending tasks') {
                logger.error(`async lock exploded on lock "${lockId}" with name "${namespace}". ${e.stack}`);
                if (debug.enabled) {
                    pendingCounter--;
                    lockedCounter--;
                }
                return await action();
            }

            throw e;
        }
    }
};
