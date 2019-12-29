# Algorithms

## Constraints

1. Route should not be a cycle, or having duplicate station in one route.


## Suit the Car to the Routing schedule by Time and Plate Number

```
car.id
  CarId in the cars, using by the assignments table
car.schedule
  the current schedule id the car is going
car.route
  the current route id the car is going
car.position
  the current point id the car is nearest

car.reset()
  reset the car.route and car.schedule
```


```
Procedure fitCarToSchedule
// if the current schedule is no longer available
if the car is reached the terminal station or
    the car.position is not on the routing[id == car.route].Routes
  realtime_schedule[car.schedule].finish = true
  car.reset()

if car.route exist
  return car.route
else
  responsible_schedule = assignments[CarId == car.id].schedule
  possible_route = schedule[unbegun and id in responsible_schedule and weekday].route

  relax_width = 5 * 60 secs


return car.schedule, car.route
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
  for sub_idx in sub_routes.reverse()
    if next_sub_stn == next_stn
      continue
    sub_stn = sub_routes[sub_idx]
    next_sub_stn = sub_routes[sub_idx + 1]
    
    predicted[next_stn] = predicted[next_stn] +
        prediction[RouteId == routeId and FromPointId == sub_stn and ToPointId == next_sub_stn].TimeMean
    if active[sub_stn.FromPointId -> sub_stn.ToPointId].CarId > 0
      adjust_time = -(Date.now() - active[sub_stn.FromPointId -> sub_stn.ToPointId].MinGPSTime)
      predicted[next_stn] = predicted[next_stn] + adjust_time
      break
return predicted
```

