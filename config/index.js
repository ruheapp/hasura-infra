if (!process.env.PGSQL_DATABASE) {
  throw new Error("Dot-source script/env.sh first!");
}

const user = process.env['PGSQL_USER_HN'] ?
  `${process.env['PGSQL_USER']}@${process.env['PGSQL_USER_HN']}` :
  process.env['PGSQL_USER'];

module.exports = {
  "development": {
    "username": user,
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