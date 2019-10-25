# Hasura Infrastructure in a Box

This repo uses [Pulumi](https://pulumi.com) to instantiate and manage a PostgreSQL + Hasura development environment in Docker. It will create a PostgreSQL instance and database, run the migrations for your schema, then boot up Hasura against that database.

### Getting started

First Create a Pulumi account and install the CLI - then:

```sh
pulumi stack   ## Create a new stack that we'll install against

pulumi config set hasura-docker:pguser MyCoolUserName
pulumi config set hasura-docker:pgpass OmgASekritPassword!

script/bootstrap
```

### Using Hasura

To open Hasura, first go to http://localhost:8081/console/data/schema/public and hit "Track" on all of the tables except the `SequelizeMeta` table. Now, you've got a GraphQL server of your schema, try making queries at http://localhost:8081/console/api-explorer

### What Else Can I Do

Now, we can do a few things - first, run an instance of `pgcli`

```
./script/pgcli

ana@localhost:ana> \l                                                                                                      
+--------------+---------+------------+------------+------------+---------------------+
| Name         | Owner   | Encoding   | Collate    | Ctype      | Access privileges   |
|--------------+---------+------------+------------+------------+---------------------|
| ana          | ana     | UTF8       | en_US.utf8 | en_US.utf8 | <null>              |
| postgres     | ana     | UTF8       | en_US.utf8 | en_US.utf8 | <null>              |
| ruhe-f8ebb58 | ana     | UTF8       | C          | C          | <null>              |
| template0    | ana     | UTF8       | en_US.utf8 | en_US.utf8 | =c/ana              |
|              |         |            |            |            | ana=CTc/ana         |
| template1    | ana     | UTF8       | en_US.utf8 | en_US.utf8 | =c/ana              |
|              |         |            |            |            | ana=CTc/ana         |
+--------------+---------+------------+------------+------------+---------------------+

\c ruhe-f8ebb58

ana@localhost:ana> \c ruhe-f8ebb58                                                                                         
You are now connected to database "ruhe-f8ebb58" as user "ana"

ana@localhost:ruhe-f8ebb58> SELECT * FROM "Users";                                                                         
+------+--------+---------+-------------+-------------+
| id   | name   | email   | createdAt   | updatedAt   |
|------+--------+---------+-------------+-------------|
+------+--------+---------+-------------+-------------+
```

Next, we can use Sequelize to connect to our database:

```sh
. script/env.sh
node
```

```js
db = require('./models')
db.User.create({name: "Sally", email: "sally@iscool.com"})
```
