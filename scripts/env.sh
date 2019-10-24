export PGSQL_DATABASE=`pulumi stack output -j | jq '.db.name'`
export PGSQL_USER=`pulumi config get pguser`
export PGSQL_PASS=`pulumi config get pgpass`
