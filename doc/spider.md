# API Reference

All functions are using method POST.


## `getSchedule`

### Parameters
None

### Return

From Monday(0) to Sunday(6)

```json
{
    "lines": [
        {
            "nthu-red": {
                "organization": "nthu",
                "organizationName": "清大",
                "name": "紅線",
                "forward": {
                    "from": "北校門口",
                    "to": "台積館",
                    "routes": [
                        "北校門口",
                        "綜二館",
                        "楓林小徑",
                        "人社院",
                        "台積館"
                    ],
                    "schedule": [
                        [
                            { "time": "07:20", "type": "small", "from": "北校門口" },
                            { "time": "07:45", "type": "small", "from": "北校門口" },
                            { "time": "07:50", "type": "small", "from": "北校門口" },
                            { "time": "08:05", "type": "small", "from": "北校門口" },
                            { "time": "08:15", "type": "small", "from": "北校門口" },
                            ...
                        ],
                        ...
                    ]
                },
                "backward": {
                    "from": "台積館",
                    "to": "北校門口",
                    "routes": [
                        "台積館",
                        "南門停車場",
                        "奕園停車場",
                        "楓林小徑",
                        "綜二館",
                        "北校門口"
                    ],
                    "schedule": [
                        [
                            { "time": "07:27", "type": "small", "from": "台積館" },
                            { "time": "07:52", "type": "small", "from": "台積館" },
                            { "time": "07:57", "type": "small", "from": "台積館" },
                            { "time": "08:12", "type": "small", "from": "台積館" },
                            { "time": "08:22", "type": "small", "from": "台積館" },
                            ...
                        ],
                        ...
                    ]
                }
            },
            "nthu-green": {...},
        }
    ]
}
```


## `getHistoryData`

### Parameters

```json
{
    "buses": ["038-GG"]
}
```

### Example

### Return



## `getRealtimeData`

### Parameters
`lines: Array` 

### Example

```json
{
    "lines": ["nthu-red", "nthu-green"]
}
```

### Return
```json
{
    "lines": {
        "nthu-red": {
            "organization": "nthu",
            "organizationName": "清大",
            "name": "紅線",
            "forward": {
                "from": "北大門",
                "to": "台積館",
                "routes": [
                    "北大門",
                    "綜二",
                    "女宿",
                    "人社院",
                    "台積館"
                ],
                "status": [
                    { "noservice": true },
                    { "noservice": true },
                    { "waiting": 0 }, // in minutes
                    { "waiting": 3 }, // in minutes
                    { "waiting": 1 }, // in minutes
                ],
                "buses": [
                    { "location": 1.8, "type": "big" },
                    { "location": 3.5, "type": "small" }
                    { "location": 3.8, "type": "small" }
                ]
            },
            "backward": [

            ]
        }
    }
}
```

## `login`

In general, you should not call this function.

### Parameters
None

### Return

```json
{
    "APPRefreshTime": "60",
    "AppFunKey": "1,2,3,5,9,6,7,8",
    "CarNo": null,
    "CheckKey": "07e304c706030ccb",
    "CompNo": "flt260",
    "LCnt": 1,
    "LoginID": "16343089",
    "ServiceNameSpace": null,
    "ServiceURL": "app1.elocation.com.tw",
    "SubCompNo": "flt260_1",
    "UserID": "nthu101",
    "UserLevel": 31,
    "UserPwd": "nthu101"
}
```

## `getAllBusInfo`
### Parameters
None
### Return
```json
[
    {
        "Addr": "新竹縣竹北市十興里縣政九路199號",
        "Angle": 14,
        "CarMemo": "19 km!h #向北",
        "CarNo": "038-GG",
        "Cartype": "遊覽車",
        "Cur_GPSTime": "2019-12-23 15:41:30",
        "Cur_PX": 121.01182565574267,
        "Cur_PY": 24.831268738265042,
        "DeviceNo": "",
        "DriverNo": "蔡孟翰",
        "Driver_Phone": "0955-573-082",
        "Pre_GPSTime": "2019-12-23 15:41:30",
        "Pre_PX": 121.01182565574267,
        "Pre_PY": 24.831268738265042,
        "Speed": 19
    },
    ...
]
```



## `get`