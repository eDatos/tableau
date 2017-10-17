const START                                 = "^";
const END                                   = "$";
const GROUP_LEFT                            = "(";
const GROUP_RIGHT                           = ")";

// GPE
const GPE_BIYEARLY_CHARACTER                = "H";
const GPE_QUARTERLY_CHARACTER               = "Q";
const GPE_MONTHLY_CHARACTER                 = "M";
const GPE_WEEKLY_CHARACTER                  = "W";

const GPE_YEAR_PATTERN                      = "[1-2]\\d{3}";
const GPE_YEARLY_PATTERN                    = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT;
const GPE_BIYEARLY_PATTERN                  = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_BIYEARLY_CHARACTER + GROUP_LEFT + "[1-2]" + GROUP_RIGHT;
const GPE_QUARTERLY_PATTERN                 = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_QUARTERLY_CHARACTER + GROUP_LEFT + "[1-4]" + GROUP_RIGHT;
const GPE_MONTH_PATTERN                     = "0[1-9]|1[0-2]";
const GPE_MONTHLY_PATTERN                   = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_MONTHLY_CHARACTER + GROUP_LEFT + GPE_MONTH_PATTERN + GROUP_RIGHT;
const GPE_WEEKLY_PATTERN                    = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_WEEKLY_CHARACTER + GROUP_LEFT + "0[1-9]|[1-4][0-9]|5[0-3]" + GROUP_RIGHT
const GPE_DAILY_PATTERN                     = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GROUP_LEFT + GPE_MONTH_PATTERN + GROUP_RIGHT + GROUP_LEFT 
                                            + "0[1-9]|[1-2][0-9]|3[0-1]" + GROUP_RIGHT;

// SDMX
const REPORTING_YEAR_PERIOD_INDICATOR       = "A";
const REPORTING_SEMESTER_PERIOD_INDICATOR   = "S";
const REPORTING_TRIMESTER_PERIOD_INDICATOR  = "T";
const REPORTING_QUARTER_PERIOD_INDICATOR    = "Q";
const REPORTING_MONTH_PERIOD_INDICATOR      = "M";
const REPORTING_WEEK_PERIOD_INDICATOR       = "W";
const REPORTING_DAY_PERIOD_INDICATOR        = "D";

const REPORTING_YEAR                        = "(\\d{4})";
const REPORTING_YEAR_TYPE                   = REPORTING_YEAR + "-(" + REPORTING_YEAR_PERIOD_INDICATOR + ")(1).*";
const REPORTING_SEMESTER_TYPE               = REPORTING_YEAR + "-(" + REPORTING_SEMESTER_PERIOD_INDICATOR + ")([1-2]).*";
const REPORTING_TRIMESTER_TYPE              = REPORTING_YEAR + "-(" + REPORTING_TRIMESTER_PERIOD_INDICATOR + ")([1-3]).*";
const REPORTING_QUARTER_TYPE                = REPORTING_YEAR + "-(" + REPORTING_QUARTER_PERIOD_INDICATOR + ")([1-4]).*";
const REPORTING_MONTH_TYPE                  = REPORTING_YEAR + "-(" + REPORTING_MONTH_PERIOD_INDICATOR + ")(0[1-9]|1[0-2]).*";
const REPORTING_WEEK_TYPE                   = REPORTING_YEAR + "-(" + REPORTING_WEEK_PERIOD_INDICATOR + ")(0[1-9]|[1-4][0-9]|5[0-3]).*";
const REPORTING_DAY_TYPE                    = REPORTING_YEAR + "-(" + REPORTING_DAY_PERIOD_INDICATOR + ")(0[0-9][1-9]|[1-2][0-9][0-9]|3[0-5][0-9]|36[0-6]).*";

const REPORTING_TIME_PERIOD_TYPE            = GROUP_LEFT + REPORTING_YEAR_TYPE + GROUP_RIGHT + "|" + GROUP_LEFT + REPORTING_SEMESTER_TYPE + GROUP_RIGHT + "|" +
                                              GROUP_LEFT + REPORTING_TRIMESTER_TYPE + GROUP_RIGHT + "|" + GROUP_LEFT + REPORTING_QUARTER_TYPE + GROUP_RIGHT + "|" +
                                              GROUP_LEFT + REPORTING_MONTH_TYPE + GROUP_RIGHT + "|" + GROUP_LEFT + REPORTING_WEEK_TYPE + GROUP_RIGHT + "|" +
                                              GROUP_LEFT + REPORTING_DAY_TYPE + GROUP_RIGHT;
const PATTERN_REPORTING_TIME_PERIOD         = START + REPORTING_TIME_PERIOD_TYPE + END;
const PATTERN_REPORTING_YEAR_TYPE           = START + REPORTING_YEAR_TYPE + END;
const PATTERN_REPORTING_SEMESTER_TYPE       = START + REPORTING_SEMESTER_TYPE + END;
const PATTERN_REPORTING_TRIMESTER_TYPE      = START + REPORTING_TRIMESTER_TYPE + END;
const PATTERN_REPORTING_QUARTER_TYPE        = START + REPORTING_QUARTER_TYPE + END;
const PATTERN_REPORTING_MONTH_TYPE          = START + REPORTING_MONTH_TYPE + END;
const PATTERN_REPORTING_WEEK_TYPE           = START + REPORTING_WEEK_TYPE + END;
const PATTERN_REPORTING_DAY_TYPE            = START + REPORTING_DAY_TYPE + END;

const DATE_TIME                             = "(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[0-1]|0[1-9]|[1-2][0-9])"
                                            + "T(2[0-3]|[0-1][0-9]):([0-5][0-9]):([0-5][0-9])(\\.[0-9]+)?(Z|[+-](?:2[0-3]|[0-1][0-9]):[0-5][0-9])?";
const PATTERN_DATE_TIME                     = START + DATE_TIME + END;

const G_YEAR                                = "(-?\\d{4})(Z|[+|-]([0-1]\\d|2[0-4])\\:([0-5]\\d))?";
const G_YEAR_MONTH                          = "(-?\\d{4})-(1[0-2]{1}|0\\d{1})(Z|([+|-]([0-1]\\d|2[0-4])\\:([0-5]\\d)))?";
const DATE                                  = "(-?\\d{4})-(1[0-2]|0[1-9])-(3[0-1]|0[1-9]|[1-2][0-9])(Z|[+-](?:2[0-3]|[0-1][0-9]):[0-5][0-9])?";
const GREGORIAN_TIME_PERIOD_TYPE            = GROUP_LEFT + G_YEAR + GROUP_RIGHT + "|" + GROUP_LEFT + G_YEAR_MONTH + GROUP_RIGHT + "|" + GROUP_LEFT + DATE + GROUP_RIGHT;
const PATTERN_GREGORIAN_TIME_PERIOD_TYPE    = START + GREGORIAN_TIME_PERIOD_TYPE + END;

const TIME_RANGE_TYPE_1                     = ".+/P.*T(\\d+H)?(\\d+M)?(\\d+(.\\d+)?S)?";
const TIME_RANGE_TYPE_2                     = ".+/P[^T]+";
const TIME_RANGE_TYPE                       = GROUP_LEFT + TIME_RANGE_TYPE_1 + GROUP_RIGHT + "|" + GROUP_LEFT + TIME_RANGE_TYPE_2 + GROUP_RIGHT;

const PATTERN_TIME_RANGE                    = START + TIME_RANGE_TYPE + END;

function calculateDate(time) {
    date = null;
    if (isTimeRange(time)) {
        date = calculateTimeRangePeriod(time);
    } else if (isReportingTimePeriod(time)) {
        date = calculateReportingPeriod(time);
    } else if (isDateTime(time)) {
        date = calculateDateTime(time);
    } else if (isGregorianTimePeriod(time)) {
        date = calculateGregorianTimePeriod(time);
    }

    return date;
}

function isTimeRange(time) {
    return time.match(new RegExp(PATTERN_TIME_RANGE));
}

function isReportingTimePeriod(time) {
    return time.match(new RegExp(PATTERN_REPORTING_TIME_PERIOD));
}

function isDateTime(time) {
    return time.match(new RegExp(PATTERN_DATE_TIME));
}

function isGregorianTimePeriod(time) {
    return time.match(new RegExp(PATTERN_GREGORIAN_TIME_PERIOD_TYPE));
}

// TIME RANGE
    // 2013-07-24/P1M
    // 2013-07-24T13:21:52.519+01:00/P1M
function calculateTimeRangePeriod(time) {
    var split = time.split("/");
    date = split[0];
    if (date.indexOf("T") != -1) {
        date = date.split("T")[0];
    }
    date = date.split("-");
    return date[2] + "-" + date[1] + "-" + date[0];
}

// REPORTING TIME PERIOD
    // 2000-A1
    // 2000-S1
    // 2000-T3
    // 2000-Q4
    // 2000-M12
    // 2000-W52
    // 2000-D353
function calculateReportingPeriod(time) {
    if (time.match(new RegExp(PATTERN_REPORTING_YEAR_TYPE))) {
        return "01-01-" + time.match(new RegExp(PATTERN_REPORTING_YEAR_TYPE))[1];
    }
    if (time.match(new RegExp(PATTERN_REPORTING_SEMESTER_TYPE))) {
        year = time.match(new RegExp(PATTERN_REPORTING_SEMESTER_TYPE))[1];
        month = (time.match(new RegExp(PATTERN_REPORTING_SEMESTER_TYPE))[3] - 1) * 6;
        return "01-" + (month + 1) + "-" + year;
    }
    if (time.match(new RegExp(PATTERN_REPORTING_TRIMESTER_TYPE))) {
        year = time.match(new RegExp(PATTERN_REPORTING_TRIMESTER_TYPE))[1];
        month = (time.match(new RegExp(PATTERN_REPORTING_TRIMESTER_TYPE))[3] - 1) * 4;
        return "01-" + (month + 1) + "-" + year;
    }
    if (time.match(new RegExp(PATTERN_REPORTING_QUARTER_TYPE))) {
        year = time.match(new RegExp(PATTERN_REPORTING_QUARTER_TYPE))[1];
        month = (time.match(new RegExp(PATTERN_REPORTING_QUARTER_TYPE))[3] - 1) * 3;
        return "01-" + (month + 1) + "-" + year;
    }
    if (time.match(new RegExp(PATTERN_REPORTING_MONTH_TYPE))) {
        year = time.match(new RegExp(PATTERN_REPORTING_MONTH_TYPE))[1];
        month = time.match(new RegExp(PATTERN_REPORTING_MONTH_TYPE))[3];
        return "01-" + month + "-" + year;
    }
    if (time.match(new RegExp(PATTERN_REPORTING_WEEK_TYPE))) {
        year = time.match(new RegExp(PATTERN_REPORTING_WEEK_TYPE))[1];
        day = (time.match(new RegExp(PATTERN_REPORTING_WEEK_TYPE))[3] - 1) * 7;
        date = new Date(year, "", day + 1);
        return date.getDate() + "-" + (date.getMonth() + 1) + "-" + year;
    }
    if (time.match(new RegExp(PATTERN_REPORTING_DAY_TYPE))) {
        year = time.match(new RegExp(PATTERN_REPORTING_DAY_TYPE))[1];
        day = time.match(new RegExp(PATTERN_REPORTING_DAY_TYPE))[3];
        date = new Date(year, "", day);
        return date.getDate() + "-" + (date.getMonth() + 1) + "-" + year;
    }
}

// DATETIME
    // 2013-07-24T13:21:52.519+01:00
    // 2013-07-24
function calculateDateTime(time) {
    if (time.indexOf("T") != -1) {
        time = time.split("T")[0];
    }
    date = time.split("-");
    return date[2] + "-" + date[1] + "-" + date[0];
}

// GREGORIAN TIME
    // 2000
    // 2000-01
    // 2000-01-31
function calculateGregorianTimePeriod(time) {
    time = time.split("-");
    switch(time.length) {
        case 1:
            return "01-01-" + time[0];
            break;
        case 2:
            return "01-" + time[1] + "-" + time[0];
            break;
        case 3:
            return time[2] + "-" + time[1] + "-" + time[0];
            break;
    }
}
