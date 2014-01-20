module.exports = function(config) {
  config.set({
    frameworks: ['mocha','chai'],
    browsers: ['Chrome'],
    files: [
      'tests/vendor/*.js',
      'vendor/*.js',
      'src/cute.js',
      'src/*.js',
      'src/**/*.js',
      'tests/setup.js',
      'tests/*_test.js'
    ],
    client: {
      mocha: {
        ui: 'bdd'
      }
    }
  });
};
