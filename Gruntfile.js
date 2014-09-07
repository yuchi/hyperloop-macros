module.exports = function (grunt) {

  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

    mochaTest: {
      options: {
        reporter: 'spec'
      },
      src: [ 'test/*/out.js' ]
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

  grunt.registerTask('obj-c', [ 'sweetjs:obj-c', 'mochaTest' ]);
  grunt.registerTask('java', [ 'sweetjs:java', 'mochaTest' ]);

  grunt.registerTask('all', [ 'sweetjs:obj-c', 'sweetjs:java', 'mochaTest' ]);

  grunt.registerTask('default', [ 'all' ]);
};
