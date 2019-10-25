#!/bin/bash

export PGSQL_DATABASE=`pulumi stack output -j | jq -r '.db.name'`
export PGSQL_USER=`pulumi config get pguser`
export PGSQL_PASS=`pulumi config get pgpass`

PORT=`pulumi stack output -j | jq -r '.hasuraContainer.ports[0].external'`
export HASURA_URL="http://localhost:$PORT"