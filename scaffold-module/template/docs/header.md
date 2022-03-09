# %%MODULE_PATH%%

[Versions](https://github.com/%%GITHUB_REPOSITORY%%/releases?q=%%MODULE_PATH%%) ([ref](https://suzuki-shunsuke.github.io/tfaction/docs/actions/release-module))

## Example

```tf
module "foo" {
 source = "github.com/%%GITHUB_REPOSITORY%%//%%MODULE_PATH%%?ref=%%REF%%"
}
```
