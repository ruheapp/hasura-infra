#!/bin/bash

set -euo pipefail

PARAMS=""

export HASURA_PRODUCTION=''
export HASURA_SCRIPT_PREFIX='infra-dev/lib'

while (( "$#" )); do
  case "$1" in
    --prod)
      export HASURA_PRODUCTION='true'
      export HASURA_SCRIPT_PREFIX='infra-prod/lib'
      shift
      break
      ;;
    --) # end argument parsing
      shift
      break
      ;;
    *) # preserve positional arguments
      PARAMS="$PARAMS $1"
      shift
      ;;
  esac
done

# set positional arguments in their proper place
eval set -- "$PARAMS"