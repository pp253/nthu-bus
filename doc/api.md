# API Reference

All functions are using method POST.

## `getSchedule` _NotImplemented_

### Parameters

None

### Return

From Monday(0) to Sunday(6)

```json
{
    "lines": {
        "nthu-red": {
            "organization": "nthu",
            "organizationName": "清大",
            "line": "red",
            "lineName": "紅線",
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
}
```

## `getHistoryData`

### Parameters

method: GET

- `CarNo` 車牌，可以使用 `%25` 作為萬用字元，如 `038%25`。
- `Driver` 駕駛名，可以使用 `%25` 作為萬用字元，如 `蔡%25`。
- `GPSTimeFrom` 紀錄搜尋開始日期，格式為 `YYYY-MM-DD`。
- `GPSTimeTo` 紀錄搜尋結束日期。注意，`GPSTimeTo` 應該比 `GPSTimeFrom` 來的晚。
- `PXFrom` 經線搜尋開始，格式為任意小數。
- `PXTo` 經線搜尋結束。注意，`PXFrom` 應該比 `PXTo` 來的小。
- `PYFrom` 緯線搜尋開始，格式為任意小數。
- `PYTo` 緯線搜尋結束。注意，`PYFrom` 應該比 `PYTo` 來的小。

上述各參數可以任意搭配，若不使用視為不進行篩選。

### Example

```
/api/getHistoryData?CarNo=038-GG&Driver=蔡孟翰&GPSTimeFrom=2019-12-25&GPSTimeTo=2019-12-29&PXFrom=120&PXTo=121.5&PYFrom=22&PYTo=25
```

### Return

```json
[
    {
        "id": 1,
        "CarNo": "038-GG",
        "GPSTime": "2019-12-27 08:46:42",
        "PX": 121.01420227823118,
        "PY": 24.823777082210466,
        "Speed": 0,
        "Angle": 288,
        "Driver": "蔡孟翰"
    },
    {
        "id": 217,
        "CarNo": "038-GG",
        "GPSTime": "2019-12-27 11:27:12",
        "PX": 121.01438062484655,
        "PY": 24.823602091547894,
        "Speed": 0,
        "Angle": 308,
        "Driver": "蔡孟翰"
    },
    ...
]
```

## `getHistoryDataCSV`

### Parameters

method: GET

The same as `getHistoryData`.

### Example

```
/api/getHistoryData?CarNo=076%&PXFrom=120.984308&PXTo=121.000161&PYFrom=24.784877&PYTo=24.799851
```

### Return

```
標籤, 車牌, 時間, 緯度, 經度, 車速, 角度, 司機
076-NN:2019-12-27 13:14:15, 076-NN, 2019-12-27 13:14:15, 24.78492699944481, 120.99239235575254, 0, 280, 李金龍1
076-NN:2019-12-27 13:14:45, 076-NN, 2019-12-27 13:14:45, 24.785012000721725, 120.99003237050371, 38, 289, 李金龍1
076-NN:2019-12-27 13:15:15, 076-NN, 2019-12-27 13:15:15, 24.786297026106993, 120.98853396225553, 11, 36, 李金龍1
076-NN:2019-12-27 13:15:45, 076-NN, 2019-12-27 13:15:45, 24.787383688254348, 120.9882573410028, 12, 352, 李金龍1
076-NN:2019-12-27 13:16:15, 076-NN, 2019-12-27 13:16:15, 24.789178656208627, 120.98933231766287, 34, 46, 李金龍1
076-NN:2019-12-27 13:16:45, 076-NN, 2019-12-27 13:16:45, 24.79030531009165, 120.9902756402023, 14, 359, 李金龍1
```

## `getRealtimeData` _NotImplemented_

### Parameters

- `lines: Array`

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
            "backward": {...}
        },
        "nthu-green": {...},
    }
}
```

## `login` _NotImplemented_

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
