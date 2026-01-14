resource "null_resource" "foo" {
  count = max(local.foo, var.hello)
}
