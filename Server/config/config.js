const config = {
    production : {
        DATABASE: process.env.MONGO_URI,
        HASH: process.env.HASH
    },
    default: {
        HASH: 'metropolis-secret-key',
        DATABASE: "mongodb://localhost:27017/healthApp"
    }
}

exports.get = function get(env){
    return config[env] || config.default
}