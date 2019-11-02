#!/bin/bash

STACK=`pulumi stack output -j`

echo export PGSQL_DATABASE=`echo $STACK | jq -r '.db.name'`;

echo export PGSQL_USER=`pulumi config get pguser`
echo export PGSQL_USER_HN=`echo $STACK | jq -r .dbServer.name`
echo export PGSQL_PASS=`pulumi config get pgpass`;

echo export PGSQL_HOST=`echo $STACK | jq -r .dbServer.fqdn`;

SITE=`echo $STACK | jq .appService.defaultSiteHostname`
echo export HASURA_URL="http://$SITE"

echo export HASURA_JUMPBOX_HOSTNAME=`echo $STACK | jq -r '.jumpboxIp.fqdn'`;