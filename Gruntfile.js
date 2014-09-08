module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    mochaTest: {
      options: {
        reporter: 'spec'
      },
      "obj-c": {
        src: 'test/obj-c/out.js'
      },
      "java": {
        src: 'test/java/out.js'
      }
    },

    sweetjs: {
      "obj-c": {
        options: {
          modules: [ './obj-c', './test/macros' ]
        },
        src: 'test/obj-c/source.sjs',
        dest: 'test/obj-c/out.js'
      },
      "java": {
        options: {
          modules: [ './java', './test/macros' ]
        },
        src: 'test/java/source.sjs',
        dest: 'test/java/out.js'
      }
    }

  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-sweet.js');

  grunt.registerTask('obj-c', [ 'sweetjs:obj-c', 'mochaTest:obj-c' ]);
  grunt.registerTask('java', [ 'sweetjs:java', 'mochaTest:java' ]);

  grunt.registerTask('all', [ 'sweetjs', 'mochaTest' ]);

  grunt.registerTask('default', [ 'all' ]);
};
