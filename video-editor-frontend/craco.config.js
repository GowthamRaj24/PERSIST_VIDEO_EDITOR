module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    "os": false,
                    "util": false,
                    "zlib": false
                }
            }
        }
    }
};
