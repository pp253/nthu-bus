# Algorithms

## Constraints

1. Route should not be a cycle, or having duplicate station in one route.

## Suit the Car to the Routing schedule by Time and Plate Number

```
car.id
  CarId in the cars, using by the assignments table
car.schedule
  the current schedule id the car is going, save in the realtime_schedule
car.route
  the current route id the car is going, save in the realtime_schedule
car.position / car.lastPosition
  the current point id the car is nearest, save in the realtime_schedule
car.error
  the count of the error happend, if the error>2 the car should be
  considered as lost in connection and be highlighted

car.reset()
  reset the car.route and car.schedule
```

```
Procedure allPoints(routeId, fromPointId)
points = []
begin = false
routes = main_routing[id == routeId]
for stn_idx in routes
  if stn_idx == routes.length - 1
    break
  stn = routes[stn_idx]
  next_stn = routes[stn_idx + 1]
  for sub_stn of sub_routing[FromPointId == stn and ToPointId == next_stn]
    if sub_stn == fromPointId
      begin = true
    if begin
      points.push(sub_stn)
return points
```

```
Procedure inExpectedRange(car)
if car.route not exist
  return true
if car.position in allPoints(car.route, car.lastPosition)
  return true
return false
```

```
Procedure fitCarToSchedule(car)
// if the current schedule is no longer available
// 1) the car has rach the terminal station
// 2) Is not in the expected range of road
// 3) Time exceed too much
relax_width = 5 * 60 secs
exceed_width = 5 * 60 secs + relax_width // should be larger than relax_width

if car.position == main_routing[id == car.route].Routes[-1] or
    not inExpectedRange(car) or
    Date.now() - (main_routing[id == car.route].DepartureTime + .ExpectedRunningLength) > exceed_width
  realtime_schedule[ScheduleId == car.schedule and CarId == car.id].Status = 'finish'
  car.reset()

if car.route exist
  return car.schedule

// if the car should be registered to a new schedule
// first of all, the car can't be assigned to a route right now
// 1) in the relax_width, the bus has already on the route
responsible_schedule = assignments[CarId == car.id].ScheduleId
possible_schedule = schedule[
    id in responsible_schedule and
    weekday matched and
    being Unbegun in realtime_schedule[scheduleId == id] and
    DepartureTime BETWEEN now() - relax_width AND now() + relax_width]
car.schedule = possible_schedule.id[0]
car.route = possible_schedule.RouteId[0]
realtime_schedule[ScheduleId == car.schedule].CarId = car.id
realtime_schedule[ScheduleId == car.schedule].Status = 'ongoing'

// set all missing schedule
realtime_schedule[
    ScheduleId in schedule[DepartureTime < now() - relax_width] and
    Status == 'unbegun'
].Status = 'missing'

return car.schedule
```

## Predict the waiting time

```
Procedure predict(routeId)
active = {}
for pt of prediction[RouteId == routeId]
  cars = realtime[PredictionId == pt.id and PointId == pt.FromPointId]
  active[pt.FromPointId -> pt.ToPointId].CarId = cars.CarId or []
  active[pt.FromPointId -> pt.ToPointId].MinGPSTime = min(cars.GPSTime) or 0

predicted = {}
for idx in main_routing[id == routeId].Routes
  routes = main_routing[id == routeId].Routes
  stn = routes[idx]
  next_stn = routes[idx + 1]

  // if stn is terminal stop
  if idx == routes.length - 1
    continue

  // if it's starting stop
  if prediction[FromPointId == routes[idx] and ToPointId == next_stn].StartingStation == 1
    predicted[stn] = next departure time of route in schedule table

  predicted[next_stn] = predicted[stn]
  sub_routes = sub_routing[FromPointId == stn and ToPointId == next_stn].Routes

  // if car is in the middle of stops
  // FIXME: wrong
  for sub_idx in sub_routes.reverse()
    sub_stn = sub_routes[sub_idx]
    next_sub_stn = sub_routes[sub_idx + 1]
    if next_sub_stn == next_stn
      continue

    predicted[next_stn] = predicted[next_stn] +
        prediction[RouteId == routeId and FromPointId == sub_stn and ToPointId == next_sub_stn].TimeMean
      
    if active[sub_stn.FromPointId -> sub_stn.ToPointId].CarId > 0
      adjust_time = -(Date.now() - active[sub_stn.FromPointId -> sub_stn.ToPointId].MinGPSTime)
      predicted[next_stn] = predicted[next_stn] + adjust_time
      break
return predicted
```
