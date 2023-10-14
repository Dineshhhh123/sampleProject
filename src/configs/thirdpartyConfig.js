module.exports = {
    TOKEN: {
        JWT: true,
        OAUTH: false
    },
    DB_CHOICE: "MONGO",
    FORGOT_PASSWORD: {
        EMAIL_LINK: true
    },
    PASSWORD_COMPLEXITY: {
        min: 8,
        max: 26,
        lowerCase: 1,
        upperCase: 1,
        numeric: 1,
        symbol: 1,
        requirementCount: 4,
    },
    SESSION_LIMIT: 10
}