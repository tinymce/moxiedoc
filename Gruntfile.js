module.exports = function(grunt) {
  grunt.initConfig({
    nodeunit: {
      all: ['test/**/*.js']
    },

    watch: {
      test: {
        options: {
          spawn: false
        },

        files: ['lib/**/*.js', 'test/**/*.js'],
        tasks: ['nodeunit']
      }
    }
  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', ['nodeunit']);
};