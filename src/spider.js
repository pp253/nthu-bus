import request from 'request-promise-native'
import logger from './lib/logger'

function getJson(body) {
  const parse = /<\?xml version="1\.0" encoding="utf-8"\?>\r\n<string xmlns="([^"]*)">([^<]*)<\/string>/g
  let parsed = parse.exec(body)
  try {
    return JSON.parse(parsed[2])
  } catch (e) {
    return body
  }
}

let lastLogin = 0
let loginInterval = 60 * 60 * 1000 // in ms

let profile = {
  APPRefreshTime: '60',
  AppFunKey: '1,2,3,5,9,6,7,8',
  CarNo: null,
  CheckKey: '',
  CompNo: 'flt260',
  LCnt: 1,
  LoginID: '16343089',
  ServiceNameSpace: null,
  ServiceURL: 'app1.elocation.com.tw',
  SubCompNo: 'flt260_1',
  UserID: 'nthu101',
  UserLevel: 31,
  UserPwd: 'nthu101'
}

let data = []
let dataRetriveInterval = 10 * 1000
let lastDataRetrive = 0

/**
 * Get the CheckKey
 */
function login(forceRefresh = false) {
  return new Promise((resolve, reject) => {
    if (forceRefresh || Date.now() - lastLogin > loginInterval) {
      let body = `UserPwd=${profile.UserPwd}&CheckKey=&CompNo=${profile.CompNo}&UserID=${profile.UserID}`

      lastLogin = Date.now()
      request({
        method: 'POST',
        uri: 'http://www.elocation.com.tw/WebService/WS_BLogin.asmx/loginChk',
        body: body,
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'content-length': body.length
        }
      })
        .then(body => {
          const rep = getJson(body)
          if (rep === false) {
            throw Error('Failed to login.')
          }
          profile = rep
          resolve(profile)
          logger.info('API login success')
        })
        .catch(err => {
          logger.error(err)
          reject(err)
        })
    } else {
      resolve(profile)
    }
  })
}

export function getAllBusInfo(forceRefresh = false) {
  return new Promise((resolve, reject) => {
    login(forceRefresh).then(profile => {
      if (forceRefresh || Date.now() - lastDataRetrive > dataRetriveInterval) {
        let body = `_quickViewCondto={"CheckKey":"${profile.CheckKey}","CompNo":"${profile.CompNo}","StatusMemo":"","SubCompNo":"${profile.SubCompNo}","{UserCarNo":"","UserID":"${profile.UserID}","UserLevel":"${profile.UserLevel}"}`

        lastDataRetrive = Date.now()
        return request({
          method: 'POST',
          uri: `http://${profile.ServiceURL}/webservice/WS_QuickView.asmx/getData2`,
          body: body,
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
            'content-length': body.length
          }
        })
          .then(body => {
            const rep = getJson(body)
            if (rep === 'TimeOut') {
              // resolve(getData(true))
              reject('TimeOut')
              return
            }
            // delete all irrelevant column
            for (let item of rep) {
              delete item['CTypeCode']
              delete item['Cid']
              delete item['CompNo']
              delete item['Fuel']
              delete item['IPNO']
              delete item['IS_DVR_On']
              delete item['IS_IMG_On']
              delete item['IconType']
              delete item['Now_Temperature']
              delete item['RoadTrackName']
              delete item['Scy_On']
              delete item['SubCompNo']
              delete item['volt']
            }
            data = rep
            resolve(data)
          })
          .catch(err => {
            reject(err)
          })
      } else {
        resolve(data)
      }
    })
  })
}
