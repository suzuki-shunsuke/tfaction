#!/usr/bin/env bash

set -eu
set -o pipefail

version=$1

git ls-files | grep -E "/action\.yaml$" |
  xargs -n 1 sed -i "s|- uses: suzuki-shunsuke/tfaction/\(.*\)@main|- uses: suzuki-shunsuke/tfaction/\1@$version|"

git checkout -b "release/$version"
git ls-files | grep -E "/action\.yaml$" | xargs git add
git commit -m "chore: release $version"
git tag "$version"
git push origin "$version"
git checkout main
