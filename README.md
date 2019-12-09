# Hasura Infrastructure in a Box

This repo uses [Pulumi](https://pulumi.com) to instantiate and manage a PostgreSQL + Hasura development environment in Docker. It will create a PostgreSQL instance and database, run the migrations for your schema, then boot up Hasura against that database.

### Getting started

First Create a Pulumi account and install the CLI - then:

```sh
pulumi stack   ## Create a new stack that we'll install against

pulumi config set hasura-infra:pguser MyCoolUserName
pulumi config set --secret hasura-infra:pgpass OmgASekritPassword!

script/bootstrap
```

### Using Hasura

hasura-infra is set up to use Hasura's built-in migrations framework for PostgreSQL - this is super great, because it means that as you create tables and relations using the UI, instead of modifying your production database, it will *write out the migrations* for you to the `db` directory. To get started, run:

```sh
script/hasura console
```

When you're ready to apply these migrations to another environment (say production, or staging), run:

```sh
pulumi stack select my-prod-stack
script/bootstrap
```

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

## Production Mode

This repo also contains a production-quality build of this setup, using Microsoft Azure. To run it:

```sh
pulumi stack init  ## Create a non-dev stack

pulumi config set hasura-infra:pguser MyCoolUserName
pulumi config set --secret hasura-infra:pgpass OmgASekritPassword!

script/bootstrap --prod
```

To find where your Hasura server ended up, run:

```sh
eval `script/env.sh`
echo "Your Hasura installation is at $HASURA_URL"
