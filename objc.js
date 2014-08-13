macro use {
  rule { hyperloop } => { "use hyperloop" }
  rule { strict } => { "use strict" }
}

macro as {
  rule infix { $l:expr | $r:objc_type_name } => {
    (($l != null) && $l.cast($r))
  }
}

macroclass objc_type_alias {
  pattern {
    rule { ( $to:objc_type_alias *) }
    with $name = #{ $to$name }
    with $pointer = #{ 1 $to$pointer }
  }
  pattern {
    rule { ( $name:ident ) }
    with $pointer = 0
  }
  pattern {
    rule { $name:ident }
    with $pointer = 0
  }
  pattern {
    rule { ( void ) }
    with $name = #{ "void" }
    with $pointer = 0
  }
  pattern {
    rule { void }
    with $name = #{ "void" }
    with $pointer = 0
  }
}

macro objc_type_name {
  case { _ $t:lit } => {
    var name = unwrapSyntax(#{ $t });
    return [ makeValue(name, #{ $t }) ];
  }
  case { _ $t:objc_type_alias } => {
    var name = #{ $t$pointer }.reduce(function (memo, stx) {
      return memo + (stx.token.value ? ' *' : '');
    }, unwrapSyntax(#{ $t$name }));

    return [ makeValue(name, #{ $t$name }) ];
  }
}

macroclass objc_method_params_alias {
  pattern {
    rule { $part:ident $[:] $type:objc_type_name $arg:ident $inner:objc_method_params }
  }
  pattern {
    rule { $part:ident $[:] $type:objc_type_name $arg:ident }
    with $inner = #{null}
  }
  pattern {
    rule { $part:ident }
    with $type = #{null}
    with $arg = #{null}
    with $inner = #{null}
  }
}

macro objc_method_params {
  case { _ $params:objc_method_params_alias } => {
    return #{ $params$part $params$type $params$arg $params$inner };
  }
}

macroclass objc_method_alias {
  pattern { rule { + $returns:objc_type_name $params:objc_method_params $body } with $static = #{1} }
  pattern { rule { - $returns:objc_type_name $params:objc_method_params $body } with $static = #{0} }
}

macro objc_method {
  case { $ctx $m:objc_method_alias } => {
    var params = #{ $m$params }.slice(0, -1);
    var name = unwrapSyntax(params[ 0 ]);
    var args = [];
    var argNames = [];

    var i = 0, l = params.length;
    var argPart, argType;
    var ctx = #{ $ctx };

    if (params[ 1 ].token.type !== parser.Token.NullLiteral) {
      for (; i < l; i += 3) {
        argPart = unwrapSyntax(params[ i + 0 ]);
        argPart = makeValue(String(argPart), ctx);
        argType = unwrapSyntax(params[ i + 1 ]);
        argType = makeValue(String(argType), ctx);
        argName = unwrapSyntax(params[ i + 2 ]);
        argName = makeIdent(String(argName), ctx);

        args = args.concat(#{,}).concat([ makeDelim( '{}', #{name:}.concat(argPart).concat(#{,}).concat(#{type:}).concat(argType), ctx) ]);
        argNames = argNames.concat(#{,}).concat(argName);
      }

      args = args.slice(1);
      argNames = argNames.slice(1);
    }

    letstx $methodName = [ makeValue(name, #{ $m$params$name }) ];
    letstx $methodArgs = args;
    letstx $funcArgs = argNames;

    return #{{
        name: $methodName,
        static: $m$static,
        returns: $m$returns,
        arguments: [ $methodArgs ],
        action: function ( $funcArgs ) $m$body
    }}
  }
}

macro objc_class_meta {
  rule { extends $type:objc_type_name } => { .implements($type) }
  rule { $mode:ident $type:objc_type_name } => { .$mode($type) }
}

macro class {
  rule {
    native $className:ident
      $($meta:objc_class_meta) ...
    {
      $($m:objc_method ) ...
    }
  } => {
    Hyperloop.defineClass($className)
      $meta ...
      $( .method($m) ) ...
      .build();
  }
}

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
