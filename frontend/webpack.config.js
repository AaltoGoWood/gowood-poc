const path = require('path');
require('dotenv').config();

const appPath = (...names) => path.join(process.cwd(), ...names);

console.log('FOO: ', process.env.FOO);
console.log('DOTENV_CONFIG_FOO: ', process.env.FOO);

console.log('QUERY_SERVICE_URL: ', process.env.QUERY_SERVICE_URL);
console.log('DOTENV_CONFIG_QUERY_SERVICE_URL: ', process.env.QUERY_SERVICE_URL);

console.log('NODE_ENV: ', process.env.NODE_ENV);

const queryServiceUrl =
    process.env.QUERY_SERVICE_URL || 'http://localhost:3000/';

console.log('queryServiceUrl', queryServiceUrl);

//This will be merged with the config from the flavor
module.exports = {
    entry: {
        main: [appPath('src', 'index.ts'), appPath('src', 'css', 'styles.scss')]
    },
    module: {
        rules: [
            {
                test: /\.geojson$/,
                exclude: /node_modules/,
                use: {
                    loader: 'json-loader'
                }
            }
        ]
    },
    output: {
        filename: 'bundle.[hash].js',
        path: appPath('build'),
        publicPath: '/'
    },
    devServer: {
        proxy: {
            '/api': 'http://localhost:3000/'
        }
    }
};
