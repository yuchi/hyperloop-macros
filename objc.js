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
    with $pointer = #{ 1 $to$pointer }
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
    rule { $part:ident $[:] $type:objc_type_name $arg:ident $inner:objc_method_params_alias }
  }
  pattern {
    rule { $part:ident $[:] $type:objc_type_name $arg:ident }
    with $inner = #{null}
  }
  pattern {
    rule { $part:ident }
    with $type = #{null}
    with $arg = #{null}
  }
}

macroclass objc_method_alias {
  pattern { rule { + $returns:objc_type_name $params:objc_method_params_alias $body } with $static = #{1} }
  pattern { rule { - $returns:objc_type_name $params:objc_method_params_alias $body } with $static = #{0} }
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
  case { _ $m:objc_method_alias } => {
    var name = unwrapSyntax(#{ $m$params$part });
    var args = [];
    var argPart = #{ $m$params$part };
    var argType = #{ $m$params$type };
    var argName = #{ $m$params$name };
    var argInner = #{ $m$params$inner }

    while (argType && argType[0] && argType[0].token.type !== parser.Token.NullLiteral) {
      console.dir(argInner);

      argType = null;
    }

    letstx $methodName = [ makeValue(name, #{ $m$params$name }) ];
    letstx $methodArgs = [ makeDelim("[]", args, #{ $m$params$name }) ]

    return #{{
        name: $methodName,
        static: $m$static,
        returns: $m$returns,
        arguments: $methodArgs,
        action: function () $m$body
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
  + ((UIWindow*)*) gestureRecognize { return this; }
  + ((UIWindow*)*) gestureRecognize:(id) gesture lol:(id)lol { return this; }
  + (UIWindow*) gestureRecognize:(id) gesture { return this; }
  + (UIWindow) gestureRecognize:(id) gesture { return this; }
  + UIWindow gestureRecognize:(id) gesture { return this; }
  - ((UIWindow*)*) gestureRecognize:(id) gesture { return this; }
  - (UIWindow*) gestureRecognize:(id) gesture { return this; }
  - (UIWindow) gestureRecognize:(id) gesture { return this; }
  - UIWindow gestureRecognize:(id) gesture { return this; }
  + "UIWindow**" gestureRecognize:(id) gesture { return this; }
  + "UIWindow*" gestureRecognize:(id) gesture { return this; }
  + "UIWindow" gestureRecognize:(id) gesture { return this; }
  - "UIWindow**" gestureRecognize:(id) gesture { return this; }
  - "UIWindow*" gestureRecognize:(id) gesture { return this; }
  - "UIWindow" gestureRecognize:(id) gesture { return this; }
  - void gestureRecognize:(id) gesture { return this; }
};

console.log( objc_type_name ((UIWindow*)*) )
console.log( objc_type_name (UIWindow*) )
console.log( objc_type_name (UIWindow) )
console.log( objc_type_name UIWindow )
console.log( objc_type_name 'UIWindow**' )
console.log( objc_type_name 'UIWindow*' )
console.log( objc_type_name 'UIWindow' )
