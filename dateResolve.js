const momenttz = require('moment-timezone');
module.exports = {
  getDate() {
    return momenttz.utc(momenttz.tz('Asia/Karachi').format('YYYY-MM-DDTHH:mm:ss')).toDate();
  },
  getDateWithParam(date) {
    return momenttz.utc(momenttz.tz(date,'Asia/Karachi').format('YYYY-MM-DDTHH:mm:ss')).toDate();
  },
  getMomentDate() {
    return momenttz.utc(momenttz.tz('Asia/Karachi').format('YYYY-MM-DDTHH:mm:ss'));
  },
  getMomentDateWithParam(date) {
    return momenttz.utc(momenttz.tz(date,'Asia/Karachi').format('YYYY-MM-DDTHH:mm:ss'));
  }
}