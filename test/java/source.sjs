
var should = require('should');

// Utils
// -----

function ClassInterface () {
  //
}

ClassInterface.class = function () {
  return this;
}

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
}
