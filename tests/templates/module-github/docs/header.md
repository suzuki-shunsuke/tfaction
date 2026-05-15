# {{module_name}}

[Versions](https://github.com/{{github_repository}}/releases?q={{module_path}})

## Example

```tf
module "foo" {
  source = "github.com/{{github_repository}}//{{module_path}}?ref={{ref}}"
}
```
