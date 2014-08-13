/*macroclass objc_method {
  pattern {
    rule { $part:ident * }
  }
}*/

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
      return memo + (stx.token.value ? '*' : '');
    }, unwrapSyntax(#{ $t$name }));

    return [ makeValue(name, #{ $t$name }) ];
  }
}

macroclass objc_method_params_alias_x {
  pattern { rule { $name:ident : $l:objc_type_name $arg:ident } };
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

macro extract {
  case { _ $x } => { return [ makeValue(null, #{ $x }) ] }
}

/*macro objc_method {
  rule { $m:objc_method_alias } => {
    {
        name: (extract $m$params),
        static: $m$static,
        returns: $m$returns,
        arguments: (extract $m$params),
        action: function () $m$body
    }
  }
}*/

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

macro class {
  rule {

    native $className:ident {
      $($m:objc_method ) ...
    }

  } => {
    Hyperloop.defineClass($className)
      $(
        .method($m)
      ) ...
  }
}

class native GestureRecognizer {
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

console.log( objc_type_name ((UIWindow*)*) )
console.log( objc_type_name (UIWindow*) )
console.log( objc_type_name (UIWindow) )
console.log( objc_type_name UIWindow )
console.log( objc_type_name 'UIWindow**' )
console.log( objc_type_name 'UIWindow*' )
console.log( objc_type_name 'UIWindow' )
