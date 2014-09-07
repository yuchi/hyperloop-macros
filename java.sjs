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

macro import {
  case { $ctx $t:java_type_alias } => {
    var parts = #{ $t$parts }.map(unwrapSyntax);
    var type = parts.join('');
    var name = parts[ parts.length - 1 ];

    if (typeof IMPORTED_TYPES === 'undefined') IMPORTED_TYPES = {};

    IMPORTED_TYPES[ name ] = type;

    return [];
  }
  case { $ctx } => { $ctx }
}

// Public

export use;
export as;
export import;

// Protected

export java_type_name;
