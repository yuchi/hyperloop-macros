Hyperloop Macros
================

[Sweet.js][sjs] macros to accelerate Hyperloop development.

By now only utilities for Objective-C were implemented;

[sjs]: http://sweetjs.org/

## Installation

```bash
# Install in your project
npm install --save-dev hyperloop-macros
# Compile your source
sjs my_hyperloop_source.js --module hyperloop-macros/obj-c
```

## Usage

### Common

```js
// Activate Hyperloop for this file
use hyperloop;
```

### Objective-C

```js
// The `native` keyword makes the class compile to Hyperloop
class native LocDelegate
  // For clarity `implements` is (also) aliased as extends
  extends NSObject
  // Protocol the class responds to
  protocol CLLocationManagerDelegate {

  // Objective-C style message definition (copy-paste-proof)
  - (void) locationManager:(CLLocationManager *) locationManager
        didUpdateLocations:(NSArray *) locations {

    // Casting is done with the `as` keyword, but for arguments is not necessary
    var locationsRecasted = locations as (NSArray *);

    // Message passing is activated with `@` in dot-notation style
    locationManager@startUpdatingLocation();

    // Since the second argument we follow Swift’s form
    locationManager@allowDeferredLocationUpdatesUntilTraveled(null, timeout: null);
  }
}
```

### Java

> TODO

### C++

> TODO

## License

This library, *Hyperloop Macros*, is free software ("Licensed Software"); you can
redistribute it and/or modify it under the terms of the [GNU Lesser General
Public License](http://www.gnu.org/licenses/lgpl-2.1.html) as published by the
Free Software Foundation; either version 2.1 of the License, or (at your
option) any later version.

This library is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; including but not limited to, the implied warranty of MERCHANTABILITY,
NONINFRINGEMENT, or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Lesser General
Public License for more details.

You should have received a copy of the [GNU Lesser General Public
License](http://www.gnu.org/licenses/lgpl-2.1.html) along with this library; if
not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth
Floor, Boston, MA 02110-1301 USA
