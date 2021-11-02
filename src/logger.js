const winston = require('winston');
const _ = require('lodash');

const { Console } = winston.transports;
const { combine, colorize, simple } = winston.format;

if (!winston.transports || !winston.transports.length) {
    winston.add(new Console({ format: combine( colorize(), simple()) }));
}

module.exports = winston;