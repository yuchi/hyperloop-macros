
// Usage
// =====

use strict;
use hyperloop;

var cachedLocation = null;
var calculateManually = false;
var totalTraveled = 0;
var cachedSpeed = 0;
var cachedLocation = 0;

class native LocDelegate extends NSObject protocol CLLocationManagerDelegate {
  - (void) locationManager:(CLLocationManager *) locationManager
        didUpdateLocations:(NSArray *) locations {

    var locations = didUpdateLocations as NSArray;
    var i = 0, l = locations.count();
    var location;
    var coordinate;
    var lastLocation;

    var lat1, lon1, lat2, lon2;

    for (; i < l; ++i) {
      location = locations.objectAtIndex(i) as CLLocation;
      lastLocation = cachedLocation as CLLocation;
      coordinate = location.coordinate;

      if (lastLocation) {
        if (calculateManually) {
          lat1 = lastLocation.latitude;
          lon1 = lastLocation.longitude;
          lat2 = coordinate.latitude;
          lon2 = coordinate.longitude;

          var kmTraveled = 3963.0 * Math.acos(
            Math.sin(lat1 / 57.2958) * Math.sin(lat2 / 57.2958)
              + Math.cos(lat1 / 57.2958) * Math.cos(lat2 / 57.2958)
              * Math.cos(lon2 / 57.2958 - lon1 / 57.2958)
          );

          totalTraveled += kmTraveled * 3280.8399;
        }
        else {
          totalTraveled += location.distanceFromLocation(lastLocation) * 3.28084
        }
      }

      cachedSpeed = location.speed;
      cachedLocation = location;
    }
  }
}

class native GestureRecognizer
  extends NSObject
  protocol UIGestureRecognizerDelegate {

  //+ ((UIWindow*)*) gestureRecognize { return this; }
  + ((UIWindow*)*) gestureRecognize:(id)gesture lol:(id)x { return gesture + x; }
  //+ (UIWindow*) gestureRecognize:(id) gesture { return this; }
  //+ (UIWindow) gestureRecognize:(id) gesture { return this; }
  //+ UIWindow gestureRecognize:(id) gesture { return this; }
  //- ((UIWindow*)*) gestureRecognize:(id) gesture { return this; }
  //- (UIWindow*) gestureRecognize:(id) gesture { return this; }
  //- (UIWindow) gestureRecognize:(id) gesture { return this; }
  //- UIWindow gestureRecognize:(id) gesture { return this; }
  //+ "UIWindow**" gestureRecognize:(id) gesture { return this; }
  //+ "UIWindow*" gestureRecognize:(id) gesture { return this; }
  //+ "UIWindow" gestureRecognize:(id) gesture { return this; }
  //- "UIWindow**" gestureRecognize:(id) gesture { return this; }
  //- "UIWindow*" gestureRecognize:(id) gesture { return this; }
  //- "UIWindow" gestureRecognize:(id) gesture { return this; }
  //- void gestureRecognize:(id) gesture { return this; }
};

something as ((UIWindow*)*);
something as (UIWindow*);
something as UIWindow;
something as id;

console.log( objc_type_name ((UIWindow*)*) )
console.log( objc_type_name (UIWindow*) )
console.log( objc_type_name (UIWindow) )
console.log( objc_type_name UIWindow )
console.log( objc_type_name 'UIWindow**' )
console.log( objc_type_name 'UIWindow*' )
console.log( objc_type_name 'UIWindow' )
