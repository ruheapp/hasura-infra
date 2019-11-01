#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "This is where we SSH into the jumpbox!"
exit 1

pushd $DIR

export PGSQL_DATABASE=`pulumi stack output -j | jq -r '.db.name'`
export PGSQL_USER=`pulumi config get pguser`
export PGSQL_PASS=`pulumi config get pgpass`

PORT=`pulumi stack output -j | jq -r '.hasuraContainer.ports[0].external'`
export HASURA_URL="http://localhost:$PORT"

popd