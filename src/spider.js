import request from 'request-promise-native'

function getJson(body) {
    const parse = /<\?xml version="1\.0" encoding="utf-8"\?>\r\n<string xmlns="([^"]*)">([^<]*)<\/string>/g
    let parsed = parse.exec(body)
    if (parsed === null) {
        return body
    } else {
        try {
            return JSON.parse(parsed[2])
        } catch (e) {
            return body
        }
    }
}

let lastLogin = 0
let loginInterval = 60 * 60 * 1000 // in ms

let profile = {
    'APPRefreshTime': '60',
    'AppFunKey': '1,2,3,5,9,6,7,8',
    'CarNo': null,
    'CheckKey': '',
    'CompNo': 'flt260',
    'LCnt': 1,
    'LoginID': '16343089',
    'ServiceNameSpace': null,
    'ServiceURL': 'app1.elocation.com.tw',
    'SubCompNo': 'flt260_1',
    'UserID': 'nthu101',
    'UserLevel': 31,
    'UserPwd': 'nthu101'
}

let data = []


/**
 * Get the CheckKey
 */
function login(forceRefresh = false) {
    return new Promise((resolve, reject) => {
        if (forceRefresh || Date.now() - lastLogin > loginInterval) {
            let body = `UserPwd=${profile.UserPwd}&CheckKey=&CompNo=${profile.CompNo}&UserID=${profile.UserID}`

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
                    lastLogin = Date.now()
                    resolve(profile)
                    console.log('success')
                    console.log(profile)
                })
                .catch(err => {
                    console.error(err)
                })
        } else {
            resolve(profile)
        }
    })
}

export function getData(forceRefresh = false) {
    return new Promise((resolve, reject) => {
        login(forceRefresh)
            .then((profile) => {
                let body = `_quickViewCondto={"CheckKey":"${profile.CheckKey}","CompNo":"${profile.CompNo}","StatusMemo":"","SubCompNo":"${profile.SubCompNo}","{UserCarNo":"","UserID":"${profile.UserID}","UserLevel":"${profile.UserLevel}"}`

                return request({
                    method: 'POST',
                    uri: `http://${profile.ServiceURL}/webservice/WS_QuickView.asmx/getData2`,
                    body: body,
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'content-length': body.length
                    }
                })
            })
            .then(body => {
                const rep = getJson(body)
                if (rep === 'TimeOut') {
                    console.error('Timeout, try to login again.')
                    // resolve(getData(true))
                    reject('TimeOut')
                    return
                }
                data = rep
                resolve(data)
            })
            .catch(err => {
                console.error(err)
            })
    })
}

console.log('hi')
getData()
    .then((data) => {
        console.log(data)
    })
    .catch(err => {
        console.error(err)
    })
