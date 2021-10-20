const winston = require('winston');
const _ = require('lodash');

const { Console } = winston.transports;
const { combine, colorize, simple } = winston.format;

if (!winston.default || !winston.default.transports || !winston.default.transports.length) {
    winston.add(new Console({ format: combine( colorize(), simple()) }));
}

module.exports = winston;