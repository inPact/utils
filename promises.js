const Promise = require('bluebird');

/*
 * Maintains **this** scope if invoked using js #call with **this** scope.
 */
exports.promiseWhile = function (continuePredicate, action) {
    function loop(result) {
        if (!continuePredicate(result))
            return Promise.resolve(result);

        return Promise.resolve(action.call(this)).then(result => loop.call(this, result));
    }

    return Promise.resolve().then(loop.bind(this));
};

/**
 * @param {Function} donePredicate - a predicate to be checked periodically to determine whether
 * the operation has completed and the promise should return.
 */
exports.promiseUntil = function (donePredicate) {
    return this.promiseWhile(() => !donePredicate(), () => Promise.delay(50))
};

/**
 * Executes {@link continueAction} if {@link condition} returns a truthy value.
 * Returns the return value of {@link action} if it was executed, otherwise the return-value of
 * {@link elseAction} if provided or {@link condition} if no {@link elseAction} was provided.
 * @param condition
 * @param continueAction {Function} - an action to perform if condition returns a truthy value
 * @param [elseAction] {Function} - an action to perform if condition returns a falsey value (optional)
 * @returns {Promise.<TResult>|Promise}
 */
exports.promiseIf = function (condition, continueAction, elseAction) {
    return Promise.resolve(condition.call(this)).then(doContinue => {
        if (doContinue)
            return continueAction.call(this);

        if (elseAction)
            return elseAction.call(this);

        return doContinue;
    });
};