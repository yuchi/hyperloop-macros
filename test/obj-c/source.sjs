
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

// fake meta-class

function ClassInterface (name) {
  this._name = name;
  this._methods = [];
  this._implements = [];
  this._protocols = [];
}

ClassInterface.class = function () {
  return this;
}

ClassInterface.prototype.toString = function () {
  return '{' + this._name + '}';
};

ClassInterface.prototype.implements = function (parent) {
  this._implements.push(parent);
  return this;
};

ClassInterface.prototype.protocol = function (protocol) {
  this._protocols.push(protocol);
  return this;
};

ClassInterface.prototype.method = function (method) {
  this._methods.push(method);
  return this;
};

ClassInterface.prototype.build = function () {
  return {
    name: this._name,
    implements: this._implements,
    protocols: this._protocols,
    methods: this._methods,
  };
};

// Tests
// -----

describe "Objective-C" {

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
    it "should work with no argument" {
      receiver@method().should.eql('{RECEIVER} # method');
    }

    it "should work with 1 argument" {
      receiver@method('arg').should.eql('{RECEIVER} # method:/arg');
    }

    it "should work with more than one argument" {
      receiver@method('arg1', withPieces:'arg2').should.eql('{RECEIVER} # method:withPieces:/arg1/arg2');
    }
  }

  describe "Implicit method invocation with '.'" {
    TODO "should not work with no argument";
    TODO "should not work with one argument";

    it "should work with more than one argument" {
      receiver.method('arg1', withPieces: 'arg2').should.eql('{RECEIVER} # method:withPieces:/arg1/arg2');
    }
  }

  describe "Casting" {
    it "should work with literals" {
      (receiver as 'Literal').should.eql('@Literal');
    }

    it "should work with identifiers" {
      (receiver as AClass).should.eql('@AClass');
    }

    it "should work with pointers" {
      // No space
      (receiver as (AClass*)).should.eql('@AClass *');
      // With space
      (receiver as (AClass *)).should.eql('@AClass *');
      // More than one star, no spaces
      (receiver as (AClass**)).should.eql('@AClass * *');
      // More than one star, with spaces
      (receiver as (AClass * *)).should.eql('@AClass * *');
      // More than one as parens
      (receiver as ((AClass *) *)).should.eql('@AClass * *');
    }
  }

  describe "Classes" {
    // We could have used `.properties` instead of `.eql` to test only specified
    // properties. This is way more verbose, but also way more solid.

    it "should work with empty classes" {
      var clazz = class native MyClass {};

      clazz.should.eql({
        name: 'MyClass',
        implements: [],
        protocols: [],
        methods: []
      });
    }

    it "should work with `extends`" {
      var clazz = class native MyClass extends NSObject {};

      clazz.should.eql({
        name: 'MyClass',
        implements: [ 'NSObject' ],
        protocols: [],
        methods: []
      });
    }

    it "should work with `implements`" {
      var clazz = class native MyClass implements NSObject {};

      clazz.should.eql({
        name: 'MyClass',
        implements: [ 'NSObject' ],
        protocols: [],
        methods: []
      });
    }

    it "should work with `protocol`" {
      var clazz = class native MyClass protocol NSProtocol {};

      clazz.should.eql({
        name: 'MyClass',
        implements: [],
        protocols: [ 'NSProtocol' ],
        methods: []
      });
    }

    it "should work with `protocol` and `extends`" {
      var clazz = class native MyClass extends NSObject protocol NSProtocol {};

      clazz.should.eql({
        name: 'MyClass',
        implements: [ 'NSObject' ],
        protocols: [ 'NSProtocol' ],
        methods: []
      });
    }
  }

  describe "Class instance methods" {
    it "should work with no argument" {
      var clazz = class native MyClass extends NSObject protocol NSProtocol {
        - (NSNumber) aSimpleMethod {
          return 42;
        }
      };

      var method = clazz.methods[ 0 ];

      method.should.have.properties({
        name: 'aSimpleMethod',
        instance: true,
        returns: 'NSNumber',
        arguments: []
      });

      should(method.action()).eql(42);
    }

    it "should auto-cast arguments to concrete types" {
      var clazz = class native MyClass extends NSObject protocol NSProtocol {
        - (NSString) aSimpleMethod:(NSString *) arg {
          return arg;
        }
      };

      var method = clazz.methods[ 0 ];

      method.should.have.properties({
        name: 'aSimpleMethod',
        instance: true,
        returns: 'NSString',
        arguments: [
          {
            name: 'aSimpleMethod',
            type: 'NSString *'
          }
        ]
      });

      should(method.action(receiver)).eql('@NSString');
    }

    it "should work with more than one argument" {
      var clazz = class native MyClass extends NSObject protocol NSProtocol {
        - (NSString) aSimpleMethod:(NSString) arg1
                     withArguments:(NSNumber) arg2 {
          return arg1 + arg2;
        }
      };

      var method = clazz.methods[ 0 ];

      method.should.have.properties({
        name: 'aSimpleMethod',
        instance: true,
        returns: 'NSString',
        arguments: [
          {
            name: 'aSimpleMethod',
            type: 'NSString'
          },
          {
            name: 'withArguments',
            type: 'NSNumber'
          }
        ]
      });

      should(method.action(receiver, receiver)).eql('@NSString@NSNumber');
    }
  }

  describe "Class static methods" {
    it "should work with no argument" {
      var clazz = class native MyClass extends NSObject protocol NSProtocol {
        + (void) something {}
      }

      var method = clazz.methods[ 0 ];

      method.should.have.properties({
        name: 'something',
        instance: false,
        returns: 'void',
        arguments: []
      });
    }
  }
}
