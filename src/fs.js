const _ = require('lodash');//.runInContext();
const logger = require('winston');
const fs = require('fs');
const path = require('path');

/**
 * Maps the contents of {@link absoluteDirPath} to a JSON object where each file
 * or directory is a key in the object and the module loaded by requiring that file or directory is the value.
 * This function exists to supplement the "require-dir" package which does not support loading directories
 * by name (nor does any other package I have found).
 * A directory without an index.js file will (probably?) fail to load.
 * @param absoluteDirPath {String} - the absolute path to the directory that should be loaded
 * @param [options] {Object} - see below
 * @param [options.recursive] {Boolean} - True to recursively load the contents of directories, instead of trying
 * to load them by name. Takes precedence over the "loadDirs" option.
 * @param [options.loadDirs] {Boolean} - True to load directories by name, instead of traversing
 * them and loading their contents. Not compatible with the "recursive" option.
 * @param [options.camelCase] {Boolean} - False to disable the default behavior of camel-casing the keys of the result.
 * @returns {{}}
 */
exports.mapDir = function (absoluteDirPath, options = {}) {
    let result = {};

    fs.readdirSync(absoluteDirPath).forEach(entry => {
        let entryPath = path.join(absoluteDirPath, entry);
        if (fs.statSync(entryPath).isDirectory()) {
            if (options.recursive)
                return _.merge(result, this.mapDir(entryPath, options));

            if (!options.loadDirs)
                return;
        }

        try {
            let name = path.basename(entry, path.extname(entry));
            let key = options.camelCase === false ? name : _.camelCase(name);
            result[key] = require(entryPath);
        } catch (e) {
            logger.error(`load module error for: "${entryPath}": ${e.stack}`)
        }
    });

    return result;
};

/**
 * Recursively loads modules including and below {@link libPath}, filtered by {@link matcher} regex.
 * @param libPath
 * @param [options.matcher] {RegExp|Function} - a regex or predicate to filter which modules to load or return.
 * If a predicate is passed, it will be called with the module as the only argument and must return true if the
 * object is to be returned in the results.
 * @param [options.recursive] {Boolean} - load recursively through directories; defaults to true.
 * @param [options.camelCase] {Boolean} - true to camelCase the keys for loaded modules; defaults to false
 * @param [modules] - for internal use only
 */
exports.loadModules = function (libPath, options = {}, modules = {}) {
    let { matcher, camelCase, recursive = true } = options;
    let basePath = path.resolve(libPath);
    let isRegex = matcher instanceof RegExp;

    fs.readdirSync(basePath).forEach(entry => {
        let entryPath = path.join(basePath, entry);
        if (fs.statSync(entryPath).isDirectory()) {
            if (!recursive)
                return;

            return this.loadModules(entryPath, options, modules);
        }

        if (!isRegex || matcher.test(entryPath)) {
            logger.info('requiring path: ' + entryPath);
            try {
                let module = require(entryPath);

                if (!matcher || isRegex || matcher(module)) {
                    let key = path.parse(entryPath).name;

                    if (camelCase)
                        key = _.camelCase(key);

                    modules[key] = require(entryPath);
                }
            } catch (e) {
                logger.error(`Error loading module "${entryPath}": ${e.stack}`)
            }
        }
    });

    return modules;
};