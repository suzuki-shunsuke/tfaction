#!/usr/bin/env bash

set -eu
set -o pipefail

version=$1

sha=$(git rev-parse HEAD)
git ls-files | grep -E "/action\.yaml$" |
  xargs -n 1 sed -i "s|- uses: suzuki-shunsuke/tfaction/\(.*\)@main|- uses: suzuki-shunsuke/tfaction/\1@$version|"

git checkout -b "release/$version"
git ls-files | grep -E "/action\.yaml$" | xargs git add
git commit -m "chore: release $version
base revision: $sha"
git tag "$version"
git push origin "$version"
git checkout main
note_template='[Issues](https://github.com/suzuki-shunsuke/tfaction/issues?q=is%3Aissue+is%3Aclosed+milestone%3AVERSION) | [Pull Requests](https://github.com/suzuki-shunsuke/tfaction/pulls?q=is%3Apr+is%3Aclosed+milestone%3AVERSION) | https://github.com/suzuki-shunsuke/tfaction/compare/VERSION...VERSION | [Base revision](https://github.com/suzuki-shunsuke/tfaction/tree/BASE_REVISION)'
note_1=${note_template//VERSION/$version}
note=${note_1//BASE_REVISION/$sha}
gh release create "$version" -p --title "$version" -n "${note}"
