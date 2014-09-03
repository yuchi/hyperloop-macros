macro use {
  rule { hyperloop } => { "use hyperloop" }
  rule { strict } => { "use strict" }
}

macro as {
  rule infix { $l:lit | $r:objc_type_name } => {
    $l.cast($r)
  }
  rule infix { $l:ident | $r:objc_type_name } => {
    $l.cast($r)
  }
  rule infix { $l:expr | $r:objc_type_name } => {
    ($l).cast($r)
  }
}

macroclass objc_type_alias {
  pattern {
    rule { ( $to:objc_type_alias $p:($[*] ...) ) }
    with $name = #{ $to$name }
    with $pointer = #{ $p $to$pointer }
  }
  pattern {
    rule { $name:ident }
    with $pointer = ''
  }
  pattern {
    rule { ( void ) }
    with $name = #{ "void" }
    with $pointer = ''
  }
  pattern {
    rule { void }
    with $name = #{ "void" }
    with $pointer = ''
  }
}

macro objc_type_name {
  case { _ $t:lit } => {
    var name = unwrapSyntax(#{ $t });
    return [ makeValue(name, #{ $t }) ];
  }
  case { _ $t:objc_type_alias } => {
    var name = #{ $t$pointer }.reduce(function (memo, stx) {
      return memo + (stx.token.value ? ' ' + stx.token.value : '');
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
  pattern { rule { + $returns:objc_type_name $params:objc_method_params { $body ... } } with $static = #{1} }
  pattern { rule { - $returns:objc_type_name $params:objc_method_params { $body ... } } with $static = #{0} }
}

macro objc_method {
  case { $ctx $m:objc_method_alias } => {
    var params = #{ $m$params }.slice(0, -1);
    var name = unwrapSyntax(params[ 0 ]);
    var args = [];
    var argTemps = [];
    var argValues = [];

    var i = 0, l = params.length;
    var argPart, argType, argTemp, argName;
    var ctx = #{ $ctx };


    if (params[ 1 ].token.type !== parser.Token.NullLiteral) {
      for (; i < l; i += 3) {
        // The part of the method as a string value
        argPart = unwrapSyntax(params[ i + 0 ]);
        argPart = makeValue(String(argPart), ctx);

        // The type of the argument as a string value
        argType = unwrapSyntax(params[ i + 1 ]);
        argType = makeValue(String(argType), ctx);

        // The temporary _arg for storing an uncasted argument, as ident
        // (the underscore is not necessary because we have Sweet.js hygene,
        // just for style)
        argTemp = "_" + unwrapSyntax(params[ i + 2 ]);
        // Passing `null` as a context ensures that this new ident cannot be
        // referenced from the source code.
        argTemp = makeIdent(String(argTemp), null);

        // The actual name specified, as ident
        argName = unwrapSyntax(params[ i + 2 ]);
        argName = makeIdent(String(argName), ctx);

        args = args.concat(#{,}).concat([
          makeDelim( '{}', #{name:}.concat(argPart).concat(#{,}).concat(#{type:}).concat(argType), ctx)
        ]);

        argTemps = argTemps.concat(#{,}).concat(argTemp);
        argValues = argValues.concat(#{;}).concat(#{ var }).concat(argName).concat(#{=}).concat(argTemp).concat(#{as}).concat(argType);
      }

      args = args.slice(1);
      argTemps = argTemps.slice(1);
      argValues = argValues.slice(1);
    }

    letstx $methodName = [ makeValue(name, #{ $m$params$name }) ];
    letstx $methodArgs = args;
    letstx $funcTemps = argTemps;
    letstx $funcValues = argValues;

    return #{{
        name: $methodName,
        static: $m$static,
        returns: $m$returns,
        arguments: [ $methodArgs ],
        action: function ( $funcTemps ) {
          $funcValues
          $m$body ...
        }
    }}
  }
}

macro objc_class_meta {
  rule { extends $type:objc_type_name } => { .implements($type) }
  rule { $mode:ident $type:objc_type_name } => { .$mode($type) }
}

// Using `let` to avoid recursion
let class = macro {
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
  // Fallback match all rule to support `.class`
  rule { } => { class }
}

macroclass objc_message_param_alias {
  pattern { rule { $part $[:] $arg:expr } }
}

macro (@) {
  case infix {
      $receiver:expr | $ctx $method ( $first:expr , $rest:objc_message_param_alias (,) ... )
  } => {
    var parts = #{ $rest$part ... };
    var name = #{ $method }.concat(#{ $rest$part ... }).map(unwrapSyntax).concat('').join(':');
    letstx $name = [ makeValue(name, #{ $ctx }) ];
    return #{ Hyperloop.method($receiver, $name).call( $first, $($rest$arg) (,) ... ) };
  }
  case infix {
      $receiver:expr | $ctx $method ( $first:expr )
  } => {
    var name = unwrapSyntax(#{ $method }) + ':';
    letstx $name = [ makeValue(name, #{ $ctx }) ];
    return #{ Hyperloop.method($receiver, $name).call( $first ) };
  }
  case infix {
      $receiver:expr | $ctx $method ( )
  } => {
    var name = unwrapSyntax(#{ $method });
    letstx $name = [ makeValue(name, #{ $ctx }) ];
    return #{ Hyperloop.method($receiver, $name).call( ) };
  }
}

let (.) = macro {
  rule { $method ( $first:expr , $rest:( $part $[:] $arg:expr ) (,) ... ) } => {
    @ $method ( $first , $rest (,) ... )
  }
  rule { $l } => { . $l }
}

// Public

export use;
export as;
export class;
export (@);
export (.);

// Protected

export objc_type_name;
//export objc_method_params;
//export objc_method;
//export objc_class_meta;
//export objc_type_alias;
//export objc_method_params_alias;
//export objc_method_alias;
