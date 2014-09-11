
var should = require('should');

// Utils
// -----

// cheating with hygene:

global.Hyperloop = {
  defineClass: function (name) {
    return new ClassInterface(name);
  },
  method: function (receiver, name) {
    return {
      call: function () {
        var args = Array.prototype.slice.call(arguments);
        return String(receiver) + ' # ' + name + [''].concat(args).join('/');
      }
    };
  }
};

// cheating for undefined identifiers:

global.MyClass = 'MyClass';

// simple faker:

var receiver = {
  toString: function () { return '{RECEIVER}' },
  method: function () { return this },
  cast: function (to) { return '@' + to }
};

// fake meta-class:

function ClassInterface (name) {
  this._name = name;
  this._package = null;
  this._attributes = [];
  this._methods = [];
  this._properties = [];
  this._extends = [];
  this._implements = [];
}

ClassInterface.class = function () {
  return this;
}

ClassInterface.prototype.toString = function () {
  return '{' + this._name + '}';
};

ClassInterface.prototype.package = function (package) {
  this._package = package;
  return this;
};

ClassInterface.prototype.attributes = function (attributes) {
  this._attributes = this._attributes.concat(attributes);
  return this;
};

ClassInterface.prototype.extends = function (parent) {
  this._extends.push(parent);
  return this;
};

ClassInterface.prototype.implements = function (parent) {
  this._implements.push(parent);
  return this;
};

ClassInterface.prototype.property = function (property) {
  this._properties.push(property);
  return this;
};

ClassInterface.prototype.method = function (method) {
  this._methods.push(method);
  return this;
};

ClassInterface.prototype.build = function () {
  return {
    name: this._name,
    package: this._package,
    attributes: this._attributes,
    extends: this._extends,
    implements: this._implements,
    methods: this._methods,
    properties: this._properties
  };
};

// Tests
// -----

describe "Java" {

  describe "Macro name collisions" {
    it "should not happen on 'use'" {
      var use = 42;

      use.should.eql(42);
    }

    it "should not happen on 'as'" {
      var as = 42;

      as.should.eql(42);
    }

    it "should not happen on 'something.class'" {
      ClassInterface.class.should.equal(ClassInterface.class);
    }

    it "should not happen on 'something.class()'" {
      ClassInterface.class().should.equal(ClassInterface);
      ClassInterface.class(1).should.equal(ClassInterface);
    }
  }

  describe "Use macro" {
    it "should work for Hyperloop" {
      (use hyperloop).should.eql('use hyperloop');
    }

    it "should work for ES5 Strict Mode" {
      (use strict).should.eql('use strict');
    }
  }

  describe "Explicit method invocation with '@'" {
    TODO "should work with <init>";
    TODO "should work with specified types";
  }

  describe "Casting" {
    it "should work with literals" {
      (receiver as 'Literal').should.eql('@Literal');
    }

    it "should work with identifiers" {
      (receiver as AClass).should.eql('@AClass');
    }

    it "should work with packages" {
      (receiver as java.lang.String).should.eql('@java.lang.String');
    }

    it "should work with imported types" {
      import com.tests1.ImportedString;
      (receiver as ImportedString).should.eql('@com.tests1.ImportedString');
    }

    it "should work with generics" {
      (receiver as A<B<C, D>, C, D>).should.eql('@A<B<C,D>,C,D>');
      (receiver as Something<java.lang.String, java.lang.Integer>).should.eql('@Something<java.lang.String,java.lang.Integer>');
    }

    it "should work with generics and imported types" {
      import com.tests2.AA;
      import com.tests2.BB;
      import com.tests2.CC;
      (receiver as AA<BB<CC, D>, C, D>).should.eql('@com.tests2.AA<com.tests2.BB<com.tests2.CC,D>,C,D>');
    }
  }

  describe "Classes" {
    it "should work with empty classes" {
      (class native com.tests3.MyClass { }).should.have.properties({
        name: 'MyClass',
        package: 'com.tests3'
      });
    }

    it "should work with visibility modifiers" {
      class native public com.tests3.MyClass {}.attributes.should.eql([ 'public' ]);
      class native protected com.tests3.MyClass {}.attributes.should.eql([ 'protected' ]);
      class native private com.tests3.MyClass {}.attributes.should.eql([ 'private' ]);
    }

    it "should default to 'public'" {
      class native com.tests3.MyClass {}.attributes.should.eql([ 'public' ]);
    }

    it "should work with modifiers" {
      class native static final native synchronized abstract threadsafe transient com.tests3.MyClass {}
      .attributes.should.containEql("static", "final", "native", "synchronized", "abstract", "threadsafe", "transient");
    }

    it "should extend correctly" {
      class native com.tests3.MyClass extends A {}.extends.should.eql([ 'A' ]);
    }

    it "should implement interfaces" {
      class native com.tests3.MyClass implements A {}.implements.should.eql([ 'A' ]);
      class native com.tests3.MyClass implements A, B {}.implements.should.eql([ 'A', 'B' ]);
    }

    import com.tests3.AAA;

    it "should extend impoted types" {
      class native com.tests3.MyClass extends AAA {}.extends.should.eql([ 'com.tests3.AAA' ]);
    }

    it "should implement imported types" {
      class native com.tests3.MyClass implements AAA {}.implements.should.eql([ 'com.tests3.AAA' ]);
      class native com.tests3.MyClass implements A, AAA, B {}.implements.should.eql([ 'A', 'com.tests3.AAA', 'B' ]);
    }
  }

  describe "Class methods" {
    TODO "methods smoke test";
    TODO "methods attributes";
    TODO "methods annotations";
    TODO "methods arguments";
    TODO "generics in methods";
  }

  describe "Class properties" {
    TODO "properties smoke test";
    TODO "properties attributes";
    TODO "properties annotations";
  }
}
