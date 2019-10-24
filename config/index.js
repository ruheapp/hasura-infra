if (!process.env.PGSQL_DATABASE) {
  throw new Error("Dot-source scripts/env.sh first!");
}

module.exports = {
  "development": {
    "username": process.env['PGSQL_USER'],
    "password": process.env['PGSQL_PASS'],
    "database": process.env['PGSQL_DATABASE'],
    "host": "127.0.0.1",
    "dialect": "postgresql",
    "operatorsAliases": false
  },
  "test": {
    "username": "root",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "postgresql",
    "operatorsAliases": false
  },
  "production": {
    "username": "root",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "postgresql",
    "operatorsAliases": false
  }
}