/* contains the ics() factory plus the logic that builds the VCALENDAR + VEVENT strings and returns the final .ics text via calendar() */
/* global saveAs, Blob, BlobBuilder, console */

var ics = function(uidDomain, prodId) {
  'use strict';

  if (navigator.userAgent.indexOf('MSIE') > -1 && navigator.userAgent.indexOf('MSIE 10') == -1) {
    console.log('Unsupported Browser');
    return;
  }

  if (typeof uidDomain === 'undefined') { uidDomain = 'default'; }
  if (typeof prodId === 'undefined') { prodId = 'Calendar'; }

  var SEPARATOR = (navigator.appVersion.indexOf('Win') !== -1) ? '\r\n' : '\n';
  var calendarEvents = [];
  var calendarStart = [
    'BEGIN:VCALENDAR',
    'PRODID:' + prodId,
    'VERSION:2.0'
  ].join(SEPARATOR);
  var calendarEnd = SEPARATOR + 'END:VCALENDAR';
  var BYDAY_VALUES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  function datePartsForTimezone(date, timezone) {
    if (!timezone) {
      return {
        year: ("0000" + (date.getFullYear().toString())).slice(-4),
        month: ("00" + ((date.getMonth() + 1).toString())).slice(-2),
        day: ("00" + ((date.getDate()).toString())).slice(-2),
        hour: ("00" + (date.getHours().toString())).slice(-2),
        minute: ("00" + (date.getMinutes().toString())).slice(-2),
        second: ("00" + (date.getSeconds().toString())).slice(-2),
      };
    }

    var formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    var parts = formatter.formatToParts(date);
    return {
      year: parts.find(function(p) { return p.type === 'year'; })?.value ?? '0000',
      month: parts.find(function(p) { return p.type === 'month'; })?.value ?? '01',
      day: parts.find(function(p) { return p.type === 'day'; })?.value ?? '01',
      hour: parts.find(function(p) { return p.type === 'hour'; })?.value ?? '00',
      minute: parts.find(function(p) { return p.type === 'minute'; })?.value ?? '00',
      second: parts.find(function(p) { return p.type === 'second'; })?.value ?? '00',
    };
  }

  return {
    /**
     * Returns events array
     * @return {array} Events
     */
    'events': function() {
      return calendarEvents;
    },

    /**
     * Returns calendar
     * @return {string} Calendar in iCalendar format
     */
    'calendar': function() {
      return calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;
    },

    /**
     * Add event to the calendar
     * @param  {string} subject     Subject/Title of event
     * @param  {string} description Description of event
     * @param  {string} location    Location of event
     * @param  {string} begin       Beginning date of event
     * @param  {string} stop        Ending date of event
     */
    'addEvent': function(subject, description, location, begin, stop, rrule, allDay, options) {
      // I'm not in the mood to make these optional... So they are all required
      if (typeof subject === 'undefined' ||
        typeof description === 'undefined' ||
        typeof location === 'undefined' ||
        typeof begin === 'undefined' ||
        typeof stop === 'undefined'
      ) {
        return false;
      }

      // validate rrule
      if (rrule) {
        if (!rrule.rrule) {
          if (rrule.freq !== 'YEARLY' && rrule.freq !== 'MONTHLY' && rrule.freq !== 'WEEKLY' && rrule.freq !== 'DAILY') {
            throw "Recurrence rrule frequency must be provided and be one of the following: 'YEARLY', 'MONTHLY', 'WEEKLY', or 'DAILY'";
          }

          if (rrule.until) {
            if (isNaN(Date.parse(rrule.until))) {
              throw "Recurrence rrule 'until' must be a valid date string";
            }
          }

          if (rrule.interval) {
            if (isNaN(parseInt(rrule.interval))) {
              throw "Recurrence rrule 'interval' must be an integer";
            }
          }

          if (rrule.count) {
            if (isNaN(parseInt(rrule.count))) {
              throw "Recurrence rrule 'count' must be an integer";
            }
          }

          if (typeof rrule.byday !== 'undefined') {
            if ((Object.prototype.toString.call(rrule.byday) !== '[object Array]')) {
              throw "Recurrence rrule 'byday' must be an array";
            }

            if (rrule.byday.length > 7) {
              throw "Recurrence rrule 'byday' array must not be longer than the 7 days in a week";
            }

            // Filter any possible repeats
            rrule.byday = rrule.byday.filter(function(elem, pos) {
              return rrule.byday.indexOf(elem) == pos;
            });

            for (var d in rrule.byday) {
              if (BYDAY_VALUES.indexOf(rrule.byday[d]) < 0) {
                throw "Recurrence rrule 'byday' values must include only the following: 'SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'";
              }
            }
          }
        }
      }

      var start_date = new Date(begin);
      var end_date = new Date(stop);
      var now_date = new Date();
      var eventTimezone = options && options.timezone ? options.timezone : null;

      var startParts = datePartsForTimezone(start_date, eventTimezone);
      var endParts = datePartsForTimezone(end_date, eventTimezone);
      var nowParts = datePartsForTimezone(now_date, eventTimezone);

      var start_year = startParts.year;
      var start_month = startParts.month;
      var start_day = startParts.day;
      var start_hours = startParts.hour;
      var start_minutes = startParts.minute;
      var start_seconds = startParts.second;

      var end_year = endParts.year;
      var end_month = endParts.month;
      var end_day = endParts.day;
      var end_hours = endParts.hour;
      var end_minutes = endParts.minute;
      var end_seconds = endParts.second;

      var now_year = nowParts.year;
      var now_month = nowParts.month;
      var now_day = nowParts.day;
      var now_hours = nowParts.hour;
      var now_minutes = nowParts.minute;
      var now_seconds = nowParts.second;

      // Since some calendars don't add 0 second events, we need to remove time if there is none...
      var start_time = '';
      var end_time = '';
      if (start_hours + start_minutes + start_seconds + end_hours + end_minutes + end_seconds != 0) {
        start_time = 'T' + start_hours + start_minutes + start_seconds;
        end_time = 'T' + end_hours + end_minutes + end_seconds;
      }
      var now_time = 'T' + now_hours + now_minutes + now_seconds;

      var start = start_year + start_month + start_day + start_time;
      var end = end_year + end_month + end_day + end_time;
      var now = now_year + now_month + now_day + now_time;

      if (allDay) {
        // RFC5545 all-day events use DATE values and an exclusive DTEND.
        start = start_year + start_month + start_day;

        var exclusiveEndDate = new Date(end_date);
        exclusiveEndDate.setDate(exclusiveEndDate.getDate() + 1);

        var exclusive_end_year = ("0000" + (exclusiveEndDate.getFullYear().toString())).slice(-4);
        var exclusive_end_month = ("00" + ((exclusiveEndDate.getMonth() + 1).toString())).slice(-2);
        var exclusive_end_day = ("00" + ((exclusiveEndDate.getDate()).toString())).slice(-2);
        end = exclusive_end_year + exclusive_end_month + exclusive_end_day;
      }

      // recurrence rrule vars
      var rruleString;
      if (rrule) {
        if (rrule.rrule) {
          rruleString = rrule.rrule;
        } else {
          rruleString = 'rrule:FREQ=' + rrule.freq;

          if (rrule.until) {
            var uDate = new Date(Date.parse(rrule.until)).toISOString();
            rruleString += ';UNTIL=' + uDate.substring(0, uDate.length - 13).replace(/[-]/g, '') + '000000Z';
          }

          if (rrule.interval) {
            rruleString += ';INTERVAL=' + rrule.interval;
          }

          if (rrule.count) {
            rruleString += ';COUNT=' + rrule.count;
          }

          if (rrule.byday && rrule.byday.length > 0) {
            rruleString += ';BYDAY=' + rrule.byday.join(',');
          }
        }
      }

      var stamp = new Date().toISOString();

      var dtStartLine = allDay
        ? 'DTSTART;VALUE=DATE:' + start
        : (eventTimezone
          ? ('DTSTART;TZID=' + eventTimezone + ':' + start)
          : ('DTSTART;VALUE=DATE-TIME:' + start));
      var dtEndLine = allDay
        ? 'DTEND;VALUE=DATE:' + end
        : (eventTimezone
          ? ('DTEND;TZID=' + eventTimezone + ':' + end)
          : ('DTEND;VALUE=DATE-TIME:' + end));

      var calendarEvent = [
        'BEGIN:VEVENT',
        'UID:' + calendarEvents.length + "@" + uidDomain,
        'CLASS:PUBLIC',
        'DESCRIPTION:' + escapeIcsText(description),
        'DTSTAMP;VALUE=DATE-TIME:' + now,
        dtStartLine,
        dtEndLine,
        'LOCATION:' + escapeIcsText(location),
        'SUMMARY;LANGUAGE=en-us:' + escapeIcsText(subject),
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      ];

      if (rruleString) {
        calendarEvent.splice(4, 0, rruleString);
      }

      calendarEvent = calendarEvent.join(SEPARATOR);

      calendarEvents.push(calendarEvent);
      return calendarEvent;
    },

    /**
     * Download calendar using the saveAs function from filesave.js
     * @param  {string} filename Filename
     * @param  {string} ext      Extention
     */
    'download': function(filename, ext) {
      if (calendarEvents.length < 1) {
        return false;
      }

      ext = (typeof ext !== 'undefined') ? ext : '.ics';
      filename = (typeof filename !== 'undefined') ? filename : 'calendar';
      var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

      var blob;
      if (navigator.userAgent.indexOf('MSIE 10') === -1) { // chrome or firefox
        blob = new Blob([calendar]);
      } else { // ie
        var bb = new BlobBuilder();
        bb.append(calendar);
        blob = bb.getBlob('text/x-vCalendar;charset=' + document.characterSet);
      }
      saveAs(blob, filename + ext);
      return calendar;
    },

    /**
     * Build and return the ical contents
     */
    'build': function() {
      if (calendarEvents.length < 1) {
        return false;
      }

      var calendar = calendarStart + SEPARATOR + calendarEvents.join(SEPARATOR) + calendarEnd;

      return calendar;
    }
  };
};

function escapeIcsText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

export default ics;