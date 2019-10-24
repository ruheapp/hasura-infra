#!/bin/bash

export PGSQL_DATABASE=`pulumi stack output -j | jq -r '.db.name'`
export PGSQL_USER=`pulumi config get pguser`
export PGSQL_PASS=`pulumi config get pgpass`
