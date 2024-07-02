#!/bin/bash

set -eu

npm run build

SCARF_VERSION="$(npm pkg get dependencies.@scarf/scarf)"
npm pkg delete scripts dependencies devDependencies
npm pkg set --json "dependencies.@scarf/scarf=$SCARF_VERSION"