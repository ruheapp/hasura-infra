#!/bin/bash

set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT="$DIR/.."

if [[ -z "${HASURA_SCRIPT_PREFIX+SET}" ]]; then
  . $ROOT/script/lib/parse-opts.sh
fi

. $ROOT/$HASURA_SCRIPT_PREFIX/env.sh