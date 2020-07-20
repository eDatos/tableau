//  GPE:
//   es.gobcan.istac.indicators.core.serviceimpl.util.GpeTimeUtils


// GPE
const GPE_BIYEARLY_CHARACTER = "H";
const GPE_QUARTERLY_CHARACTER = "Q";
const GPE_MONTHLY_CHARACTER = "M";
const GPE_WEEKLY_CHARACTER = "W";

const GPE_YEAR_PATTERN = "[1-2]\\d{3}";
const GPE_YEARLY_PATTERN = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT;
const GPE_BIYEARLY_PATTERN = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_BIYEARLY_CHARACTER + GROUP_LEFT + "[1-2]" + GROUP_RIGHT;
const GPE_QUARTERLY_PATTERN = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_QUARTERLY_CHARACTER + GROUP_LEFT + "[1-4]" + GROUP_RIGHT;
const GPE_MONTH_PATTERN = "0[1-9]|1[0-2]";
const GPE_MONTHLY_PATTERN = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_MONTHLY_CHARACTER + GROUP_LEFT + GPE_MONTH_PATTERN + GROUP_RIGHT;
const GPE_WEEKLY_PATTERN = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GPE_WEEKLY_CHARACTER + GROUP_LEFT + "0[1-9]|[1-4][0-9]|5[0-3]" + GROUP_RIGHT
const GPE_DAILY_PATTERN = GROUP_LEFT + GPE_YEAR_PATTERN + GROUP_RIGHT + GROUP_LEFT + GPE_MONTH_PATTERN + GROUP_RIGHT + GROUP_LEFT
    + "0[1-9]|[1-2][0-9]|3[0-1]" + GROUP_RIGHT;

const patternYearlyValue = new RegExp(START + GPE_YEARLY_PATTERN + END);
const patternBiyearlyValue = new RegExp(START + GPE_BIYEARLY_PATTERN + END);
const patternQuaterlyValue = new RegExp(START + GPE_QUARTERLY_PATTERN + END);
const patternMonthlyValue = new RegExp(START + GPE_MONTHLY_PATTERN + END);
const patternWeeklyValue = new RegExp(START + GPE_WEEKLY_PATTERN + END);
const patternDailyValue = new RegExp(START + GPE_DAILY_PATTERN + END);

function calculateDateGPE(date: string) {
    const granularity = guessTimeGranularity(date);
    return recodeDatesGPE(date, granularity);
}

function guessTimeGranularity(date: string): string {
    if (date.match(patternYearlyValue)) {
        return "YEARLY";
    } else if (date.match(patternBiyearlyValue)) {
        return "BIYEARLY";
    } else if (date.match(patternQuaterlyValue)) {
        return "QUARTERLY";
    } else if (date.match(patternMonthlyValue)) {
        return "MONTHLY";
    } else if (date.match(patternWeeklyValue)) {
        return "WEEKLY";
    } else if (date.match(patternDailyValue)) {
        return "DAILY";
    }
    return null;
}

function recodeDatesGPE(date: string, granularity: string): string {
    switch (granularity) {
        case "YEARLY": {
            if (date.match(patternYearlyValue)) {
                return "01-01-" + date;
            }
            break;
        }
        case "BIYEARLY": {
            if (date.match(patternBiyearlyValue)) {
                var year: number = parseInt(date.match(patternBiyearlyValue)[1]);
                var month: number = (parseInt(date.match(patternBiyearlyValue)[2]) - 1) * 6;
                return "01-" + (month + 1) + "-" + year;
            }
            break;
        }
        case "QUARTERLY": {
            if (date.match(patternQuaterlyValue)) {
                var year: number = parseInt(date.match(patternQuaterlyValue)[1]);
                var month: number = (parseInt(date.match(patternQuaterlyValue)[2]) - 1) * 3;
                return "01-" + (month + 1) + "-" + year;
            }
            break;
        }
        case "MONTHLY": {
            if (date.match(patternMonthlyValue)) {
                var year: number = parseInt(date.match(patternMonthlyValue)[1]);
                var month: number = parseInt(date.match(patternMonthlyValue)[2]);
                return "01-" + month + "-" + year;
            }
            break;
        }
        case "WEEKLY": {
            if (date.match(patternWeeklyValue)) {
                var year: number = parseInt(date.match(patternWeeklyValue)[1]);
                var day: number = (parseInt(date.match(patternWeeklyValue)[2]) - 1) * 7;
                let firstWeekDay = new Date(year, 0, day + 1);
                let firstMonday = firstWeekDay;
                if (firstWeekDay.getDay() <= 4) { // ISO year starts on Thursday
                    firstMonday.setDate(firstWeekDay.getDate() - (firstWeekDay.getDay() - 1));
                } else {
                    firstMonday.setDate(firstWeekDay.getDate() - (firstWeekDay.getDay() - 1) + 7);
                }
                return firstMonday.getDate() + "-" + (firstMonday.getMonth() + 1) + "-" + firstMonday.getFullYear();
            }
            break;
        }
        case "DAILY": {
            if (date.match(patternDailyValue)) {
                var year = parseInt(date.match(patternDailyValue)[1]);
                var month = parseInt(date.match(patternDailyValue)[2]);
                var day = parseInt(date.match(patternDailyValue)[3]);
                return day + "-" + month + "-" + year;
            }
            break;
        }
    }

    return calculateDateDataset(date);
}