#!/bin/bash

echo export PGSQL_DATABASE=`pulumi stack output -j 2>/dev/null | jq -r '.db.name'`;
echo export PGSQL_USER=`pulumi config get pguser`;
echo export PGSQL_PASS=`pulumi config get pgpass`;

PORT=`pulumi stack output -j 2>/dev/null | jq -r '.hasuraContainer.ports[0].external'`;
echo export HASURA_URL="http://localhost:$PORT";