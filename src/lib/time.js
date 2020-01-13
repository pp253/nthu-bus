let modifiedDate = null

// simulation may use this
export function setDate(date) {
  modifiedDate = date
}

export function unsetDate() {
  modifiedDate = null
}

export function issetDate() {
  if (modifiedDate) {
    return true
  } else {
    return false
  }
}

export function getDate() {
  return issetDate()? modifiedDate: new Date()
}

export function getNow() {
  return getDate().getTime()
}

export function getDay() {
  return getDate().getDay()
}

/**
 * Input
 *   hh:mm[:ss[:|.ms]]
 * Output
 *   Delta in ms counts from timestamp of 1970-1-1 00:00:00
 *   in UTC
 * @param {*} str 
 */
export function parseTimeString(str) {
  let parsed = str.split(/\.|:/)
  let date = new Date('1970-01-01')
  date.setHours(...parsed)
  return date.getTime() - date.getTimezoneOffset() * 60 * 1000
}

/**
 * Get the time of the input time
 * 
 * Input:
 *   2017-7-8 12:34
 * Output:
 *   1970-1-1 12:34
 * @param {*} time 
 */
export function getTimeOf(time) {
  return getNow() - getDateOf(time)
}

export function getTimeOfNow() {
  return getTimeOf(getNow())
}

/**
 * Get the date of the input time
 * 
 * Input:
 *   2017-7-8 12:34
 * Output:
 *   2017-7-8 00:00
 * @param {*} time 
 */
export function getDateOf(time) {
  const refTime = new Date(time)
  refTime.setHours(0, 0, 0, 0)
  return refTime.getTime()
}

export function getDateOfNow() {
  return getDateOf(getNow())
}
