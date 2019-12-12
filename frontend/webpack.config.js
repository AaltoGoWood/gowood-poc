const path = require('path');
require('dotenv').config();

const appPath = (...names) => path.join(process.cwd(), ...names);

console.log('NODE_ENV: ', process.env.NODE_ENV);

const port = process.env.PORT || 8080;
const host = process.env.HOST || 'localhost';
const queryServiceUrl =
    process.env.QUERY_SERVICE_URL || 'http://localhost:3000/';

console.log(
    'host:' + host + ' port:' + port + ' queryServiceUrl:' + queryServiceUrl
);

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
        host: host,
        port: port,
        proxy: {
            '/api': queryServiceUrl
        }
    }
};
