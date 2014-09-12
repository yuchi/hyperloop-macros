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
  case { $ctx @ $name:java_type_name ( $($element:java_annotation_element (,) ...) ) } => {
    var value = #{ $element ... }.map(unwrapSyntax).join(', ');
    var name = '@' + unwrapSyntax(#{ $name }) + '( ' + value + ' )';

    return [ makeValue(name, #{ $ctx }) ];
  }
  case { $ctx @ $name:java_type_name } => {
    var name = '@' + unwrapSyntax(#{ $name });
    return [ makeValue(name, #{ $ctx }) ];
  }
}

macro java_annotation_element {
  rule { $el:java_element_value_pair } => { $el }
  rule { $el:java_element_value } => { $el }
}

macro java_element_value_pair {
  case { $ctx $name:ident = $value:java_element_value } => {
    var name = unwrapSyntax(#{ $name });
    var value = unwrapSyntax(#{ $value });
    var old = value;
    while (old !== (value = old.trim().replace(/^\(([\s\S]*)\)$/g, '$1').trim())) {
      old = value;
    }

    if (typeof value !== 'string') throw new Error("oh!");
    return [ makeValue(name + ' = ' + value, #{ $ctx }) ];
  }
}

macro java_element_value {
  rule { $ann:java_annotation } => { $ann }
  rule { $arr:java_element_value_array_initializer } => { $arr }
  rule { $exp:java_expr_to_string } => { $exp }
}

macro java_element_value_array_initializer {
  case { $ctx { $($val:java_element_value (,) ...) } } => {
    console.dir(#{ $val ... });
    return [];
  }
}

macro java_expr_to_string {
  case { $ctx $e:expr } => {
    function unwrap(toks) {
      return toks.map(function (tok) {
        switch (tok.token.type) {
          case parser.Token.Delimiter:
            return tok.token.value[0] + unwrap(tok.token.inner) + tok.token.value[1];
          case parser.Token.StringLiteral:
            return JSON.stringify(unwrapSyntax(tok));
          default:
            return unwrapSyntax(tok);
        }
      }).join(' ');
    }

    return [ makeValue(unwrap(#{ $e }), #{ $ctx }) ];
  }
}

/*macro java_annotation {
  case { $ctx @ $name:java_type_name } => {
    var name = '@' + unwrapSyntax(#{ $name });
    return [ makeValue(name, #{ $ctx }) ];
  }
}*/

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
  rule { implements $type:java_type_name (,) ... } => { $( .implements($type) ) ... }
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
    var mods = #{ $mod ... }.map(unwrapSyntax);
    var metatype = 'field';

    if (mods.indexOf('static') >= 0 && mods.indexOf('final') >= 0) {
      metatype = 'constant';
    }

    letstx $metatype = [ makeValue(metatype, #{ $ctx }) ];

    return #{
      .property({
        name: java_ident_to_string $name,
        attributes: [ $vis , $mod (,) ... ],
        annotations: [ $ann (,) ... ],
        type: $type,
        metatype: $metatype,
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
    var mods = #{ $mod ... }.map(unwrapSyntax);
    var metatype = 'field';

    if (mods.indexOf('static') >= 0 && mods.indexOf('final') >= 0) {
      metatype = 'constant';
    }

    letstx $metatype = [ makeValue(metatype, #{ $ctx }) ];

    return #{
      .property({
        name: java_ident_to_string $name,
        attributes: [ $vis , $mod (,) ... ],
        annotations: [ $ann (,) ... ],
        metatype: $metatype,
        type: $type
      })
    };
  }

  // Method (without body)

  case {
    $ctx
    $($ann:java_annotation ...)
    $vis:java_visibility_modifier
    $($mod:java_modifier ...)
    $ret:java_type_name $name
    (
      $( $($argAnn:java_annotation ...) $argType:java_type_name $argName:ident ) (,) ...
    ) ;
  } => {
    letstx $args = #{
      $({
        annotations: [ $argAnn (,) ... ],
        type: $argType,
        name: java_ident_to_string $argName
      }) (,) ...
    };

    return #{
      .method({
        name: java_ident_to_string $name,
        attributes: [ $vis , $mod (,) ... ],
        returns: $ret,
        arguments: [ $args ],
        annotations: [ $ann (,) ... ]
      })
    }
  }

  // Method (with body)

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
    $ctx native $vis:java_visibility_modifier $($mod:java_modifier ...) $($ann:java_annotation ...)
      $t:java_type_alias
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
        .annotations([ $ann (,) ... ])
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
