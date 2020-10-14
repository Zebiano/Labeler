// Censor config
function censorConfig(config) {
    if (config.token) config.token = config.token.replace(/^.{36}/g, '*'.repeat(36))
    return config
}

// Exports
module.exports = {
    censorConfig: censorConfig
}
