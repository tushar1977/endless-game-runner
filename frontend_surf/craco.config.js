
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (config) => {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: require.resolve('buffer/')
      };
      config.plugins = [
        ...config.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer']
        })
      ];
      return config;
    }
  }
};
