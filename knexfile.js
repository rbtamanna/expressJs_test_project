module.exports = {
    client: 'mysql',
    connection: {
        host: 'localhost',
        user: 'root',
        password: '123456',
        database: 'express_test_project'
    },
    migrations: {
        directory: './migrations'
    }
};
