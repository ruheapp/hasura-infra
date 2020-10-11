#!/bin/bash

export PULUMI_SKIP_UPDATE_CHECK=1
STACK=`pulumi stack output -j 2>/dev/null`

echo export PGSQL_DATABASE=`echo $STACK | jq -r '.db.name'`;

echo export PGSQL_USER=`pulumi config get pguser 2>/dev/null`;
echo export PGSQL_USER_HN=`echo $STACK | jq -r .dbServer.name`;
echo export PGSQL_PASS=`pulumi config get pgpass 2>/dev/null`;

echo export PGSQL_HOST=`echo $STACK | jq -r .dbServer.fqdn`;

SITE=`echo $STACK | jq -r .appService.defaultSiteHostname`
echo export HASURA_URL="https://$SITE";

echo export HASURA_JUMPBOX_HOSTNAME=`echo $STACK | jq -r '.jumpboxIp.fqdn'`;

echo export HASURA_PRODUCTION=true;