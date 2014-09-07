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
      }
    }

  });

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-sweet.js');

  grunt.registerTask('obj-c', [ 'sweetjs:obj-c', 'mochaTest' ]);

  grunt.registerTask('default', [ 'sweetjs:obj-c', 'mochaTest' ]);
};
