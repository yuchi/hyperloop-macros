macro use {
  rule { hyperloop } => { "use hyperloop" }
  rule { strict } => { "use strict" }
}

macro as {
  rule infix { $l:lit | $r:java_type_name } => {
    $l.cast($r)
  }
  rule infix { $l:ident | $r:java_type_name } => {
    $l.cast($r)
  }
  rule infix { $l:expr | $r:java_type_name } => {
    ($l).cast($r)
  }
}

macroclass java_type_alias {
  pattern {
    rule { $parts:($p (.) ...) }
  }
}

macro java_type_name {
  case { $ctx $t:java_type_alias < $g:java_type_name (,) ... > } => {
    var type = #{ $t$parts }.map(unwrapSyntax).join('');
    var generics = #{ $g ... }.map(unwrapSyntax);

    if (typeof IMPORTED_TYPES === 'undefined') IMPORTED_TYPES = {};

    type = IMPORTED_TYPES[ type ] || type;

    var result = type + '<' + generics.join(',') + '>';

    letstx $result = [ makeValue(result, #{ $ctx }) ];

    return #{ $result };
  }
  case { $ctx $t:java_type_alias } => {
    var type = #{ $t$parts }.map(unwrapSyntax).join('');

    if (typeof IMPORTED_TYPES === 'undefined') IMPORTED_TYPES = {};

    type = IMPORTED_TYPES[ type ] || type;

    return [ makeValue(type, #{ $ctx }) ];
  }
  case { $ctx $t:lit } => {
    var type = unwrapSyntax(#{ $t });

    if (typeof IMPORTED_TYPES === 'undefined') IMPORTED_TYPES = {};

    type = IMPORTED_TYPES[ type ] || type;

    return [ makeValue(type, #{ $ctx }) ];
  }
}

let import = macro {
  case { $ctx $t:java_type_alias } => {
    var parts = #{ $t$parts }.map(unwrapSyntax);
    var type = parts.join('');
    var name = parts[ parts.length - 1 ];

    if (typeof IMPORTED_TYPES === 'undefined') IMPORTED_TYPES = {};

    IMPORTED_TYPES[ name ] = type;

    return [];
  }
  case { $ctx } => {
    return #{ import }
  }
}

macro java_ident_to_string {
  case { $ctx $x:ident } => {
    return [ makeValue(unwrapSyntax(#{ $x }), #{ $ctx }) ];
  }
}

macro java_annotation {
  case { $ctx @ $name:java_type_name } => {
    var name = '@' + unwrapSyntax(#{ $name });
    return [ makeValue(name, #{ $ctx }) ];
  }
}

macro java_visibility_modifier {
  rule { public }       => { "public" }
  rule { private }      => { "private" }
  rule { protected }    => { "protected" }
  rule { }              => { "public" }
}

macro java_argument_modifier {
  rule { final }        => { "final" }
  rule {}               => {}
}

macro java_modifier {
  rule { static }       => { "static" }
  rule { final }        => { "final" }
  rule { native }       => { "native" }
  rule { synchronized } => { "synchronized" }
  rule { abstract }     => { "abstract" }
  rule { threadsafe }   => { "threadsafe" }
  rule { transient }    => { "transient" }
}

macro java_class_meta {
  rule { extends $type:java_type_name } => { .extends($type) }
  rule { implements $type:java_type_name } => { .implements($type) }
  rule { $mode:ident $type:java_type_name } => { .$mode($type) }
}

macro java_value_to_string {
  case { $ctx $x:expr } => {
    // TODO This is a very naive `unwrap` implementation...
    function unwrap(o) {
      return o.map(unwrapSyntax).map(function (p) {
        if (typeof p === 'object') {
          return p.value.slice(0, 1) + unwrap(p.inner) + p.value.slice(-1);
        }
        else {
          return p;
        }
      }).join(' ');
    }

    return [ makeValue(unwrap(#{ $x }), #{ $ctx }) ];
  }
}

macroclass java_method_argument_alias {
  pattern { rule { $final:java_argument_modifier $type:java_type_name $name:ident } }
}

macro java_class_member {

  // Property (with value)

  case {
    $ctx
    $($ann:java_annotation ...)
    $vis:java_visibility_modifier
    $($mod:java_modifier ...)
    $type:java_type_name $name:ident
    = $value:java_value_to_string ;
  } => {
    return #{
      .property({
        name: java_ident_to_string $name,
        attributes: [ $vis , $mod (,) ... ],
        annotations: [ $ann (,) ... ],
        type: $type,
        value: $value
      })
    };
  }

  // Property (without value)

  case {
    $ctx
    $($ann:java_annotation ...)
    $vis:java_visibility_modifier
    $($mod:java_modifier ...)
    $type:java_type_name $name:ident ;
  } => {
    return #{
      .property({
        name: java_ident_to_string $name,
        attributes: [ $vis , $mod (,) ... ],
        annotations: [ $ann (,) ... ],
        type: $type
      })
    };
  }

  // Method

  case {
    $ctx
    $($ann:java_annotation ...)
    $vis:java_visibility_modifier
    $($mod:java_modifier ...)
    $ret:java_type_name $name
    (
      $( $($argAnn:java_annotation ...) $argType:java_type_name $argName:ident ) (,) ...
    ) { $body ... }
  } => {
    letstx $args = #{
      $({
        annotations: [ $argAnn (,) ... ],
        type: $argType,
        name: java_ident_to_string $argName
      }) (,) ...
    };

    var names = #{
      $( $argType $argName ) (,) ...
    }.reduce(function (memo, piece, n) {
      if (n % 3 === 0) return memo;
      else return memo.concat(piece);
    }, []);

    letstx $names = names;

    return #{
      .method({
        name: java_ident_to_string $name,
        attributes: [ $vis , $mod (,) ... ],
        returns: $ret,
        arguments: [ $args ],
        annotations: [ $ann (,) ... ],
        action: function ( $names ) {
          $body ...
        }
      })
    }
  }
}

let class = macro {
  case {
    $ctx native $vis:java_visibility_modifier $($mod:java_modifier ...) $t:java_type_alias
      $($meta:java_class_meta) ...
    {
      $($member:java_class_member) ...
    }
  } => {
    var parts = #{ $t$parts }.map(unwrapSyntax);
    var pack = parts.slice(0, -2).join('');
    var name = parts[ parts.length - 1 ];
    var ctx = #{ $ctx };

    letstx $modifiers = #{ $vis , $mod (,) ... };
    letstx $pack = [ makeValue(pack, ctx) ];
    letstx $className = [ makeIdent(name, ctx) ];
    return #{
      Hyperloop.defineClass($className)
        .package($pack)
        .attributes([ $modifiers ])
        $meta ...
        $member ...
        .build()
    }
  }
  case { $ctx } => {
    return #{ class }
  }
};

// Public

export use;
export as;
export class;
export import;

// Protected

export java_type_name;
