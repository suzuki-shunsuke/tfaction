# deploy-ssh-key

GitHub Actions to deploy a SSH key

## Example

```yaml
- uses: suzuki-shunsuke/tfaction/deploy-ssh-key@main
  with:
    ssh_key: ${{ secrets.SSH_KEY }}
```

## Inputs

### Required Inputs

name | type | description
--- | --- | ---
ssh_key | string | SSH Private Key

### Optional Inputs

name | type | default | description
--- | --- | --- | ---
ssh_key_path | string (file path) | `$HOME/.ssh/id_rsa` | File path to SSH Private Key

## Outputs

Nothing.
