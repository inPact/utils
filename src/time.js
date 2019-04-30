const _ = require('lodash');
const logger = require('winston/lib/winston');
const moment = require('moment-timezone');
const minutesInDay = 24 * 60;

module.exports = {
    getDayOffset: function (date, timezone) {
        if (!timezone)
            return null;

        let dateString = moment.utc(date).format('YYYY-MM-DD');
        let midnightInTz = moment.tz(dateString, timezone);
        let fourAmInTz = midnightInTz.add(4, 'hours');

        /*
         We retrieve the offset from 4am on the requested day, under the assumption
         that countries generally move the clock in the time between midnight and 3am,
         so that 4am will give the correct offset for most of the day (but may still be
         wrong if the date in question is on a day when the clock was moved and the time
         is before the move time).
         */
        return fourAmInTz._offset || 0;
    },

    toUtcMinutes: function (time, offset) {
        let minutes = moment.duration(time).asMinutes() - offset;
        return minutes >= minutesInDay
            ? minutes - minutesInDay
            : minutes < 0
                ? minutes + minutesInDay
                : minutes;
    },

    getStartOfWeek(time, firstWeekday = 'sunday') {
        let dayOffset = moment(firstWeekday, 'dddd').day();
        let weekStartDate = time.clone().startOf('week');
        weekStartDate.add(time.day() >= dayOffset ? dayOffset : (dayOffset - 7), 'days');
        return weekStartDate;
    },

    /**
     * Returns utcDateTime or the current time *formatted* with the requested timezone. I.e., the *absolute* time
     * is not changed.
     * @param [utcDateTime] - any parsable time object/string/number. If not passed, will return the current
     * local time.
     * @param timezone {String} - a valid timezone string, e.g. "Asia/Jerusalem".
     * @param [format] {String} - an optional moment date-format to use for parsing @utcDateTime.
     * @returns {moment.Moment}
     */
    getLocalTime: function (utcDateTime, timezone, format) {
        if (arguments.length === 1) {
            timezone = utcDateTime;
            utcDateTime = undefined;
        }

        if (!timezone)
            logger.warn(`time utils: local time requested without timezone. args: ${JSON.stringify(arguments)}, ` +
                        `stack: ${new Error().stack}`);

        return moment(utcDateTime, format).clone().tz(timezone);
    },

    /**
     * Returns a *different* time from the specified utcDateTime (or current time if not provided), that
     * represents the time at the specified timezone having the specified date and time parts. Use this function
     * to get a time in a specific location from a time specified in configuration that is expected to be
     * relative to the configurator's locale and therefore does not include a zone. E.g., to convert 6:30 am
     * to an absolute time in a specified time zone.
     * @param [utcDateTime] - any parsable time object/string/number. If not passed, will return the current
     * local time.
     * @param timezone {String} - a valid timezone string, e.g. "Asia/Jerusalem".
     * @param [format] {String} - an optional moment date-format to use for parsing @utcDateTime.
     * @returns {moment.Moment}
     */
    getAbsoluteTimeAtTimeZone: function (utcDateTime, timezone, format) {
        if (arguments.length === 1) {
            timezone = utcDateTime;
            utcDateTime = undefined;
        }

        if (!timezone)
            logger.warn(`time utils: absolute time requested without timezone. args: ${JSON.stringify(arguments)}, ` +
                        `stack: ${new Error().stack}`);

        return moment(utcDateTime, format).clone().tz(timezone, true);
    },

    /**
     * Copies the date portion (year, month, day) from sourceDate to targetDate, and returns targetDate.
     * @param targetDate {moment.Moment}
     * @param sourceDate {moment.Moment}
     */
    setDate(targetDate, sourceDate){
        return targetDate.set({ year: sourceDate.year(), month: sourceDate.month(), date: sourceDate.date() });
    },

    /**
     * Strips the timezone from a date-time *without* adjusting the date & time.
     * @param [dateTime] {Date|moment.Moment|String} - the datetime whose timezone to strip, or a moment or a
     * moment-parsable string.
     * If not provided, the current time is used.
     * @returns {moment.Moment}
     */
    stripTimeZone(dateTime){
        let original = moment(dateTime);
        return moment(original).utc().add(original.utcOffset(), 'minutes');
    },

    /**
     * Creates a time-boundary object based on the specified {@link times}, in the order they are provided.
     * @param timezone
     * @param date
     * @param times {Array|Object} - An object whose keys represent time-slot names, and whose values
     * represent the time-slot's start times, in a moment.duration-parsable format (e.g., HH:mm).
     * @returns {TimeBoundaries}
     */
    getTimeBoundaries: function (timezone, date, times) {
        let siteOffset = this.getDayOffset(date, timezone);
        let timeBoundaries = new TimeBoundaries();
        _.each(times, (time, key) => timeBoundaries.add(this.toUtcMinutes(time, siteOffset), key));

        return timeBoundaries;
    }
};

class TimeBoundaries {
    constructor() {
        this._bounds = [];
    }

    get bounds() {
        return this._sorted ? this._bounds : this.sort();
    }

    sort() {
        this._bounds = _.sortBy(this._bounds, 'lower');
        this._bounds.forEach((bound, i) => {
            let next = this._bounds[i + 1] || this._bounds[0];
            bound.upper = next.lower - 1;
        });

        this._sorted = true;
        return this._bounds;
    }

    add(lowerMinutes, name) {
        this._sorted = false;

        let index = this._bounds.length;
        let slot = new TimeRange(lowerMinutes, name, index);
        this._bounds.push(slot);

        // easy access to the time slot
        if (name)
            this[name] = slot;
    }

    getTimeSlot(dateTime) {
        let date = moment(dateTime);
        let minutes = date.diff(date.clone().utc().startOf('day'), 'minutes');

        return this.bounds.find(bound => bound.contains(minutes));
    }
}

class TimeRange {
    constructor(lower, name, index) {
        this.upper = null;
        this.lower = lower;
        this.index = index;
        this.name = name;
    }

    contains(minutes) {
        if (!this.upper)
            throw new Error('TimeRange: upper limit not set');

        return this.lower < this.upper
            ? minutes >= this.lower && minutes <= this.upper
            : minutes <= this.lower || minutes >= this.upper;
    }
}