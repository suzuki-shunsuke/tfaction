# Create a pull request automatically to handle the problem when apply failed

Sometimes `terraform apply` fails even if `terraform plan` passed.
In that case, tfaction automatically creates a pull request with an empty commit to fix the failure.

![image](https://user-images.githubusercontent.com/13323303/151699230-1c109a57-47d1-4c3b-9c3a-4dfec786a043.png)

![image](https://user-images.githubusercontent.com/13323303/151699142-6d19cd51-eac5-4f69-bfe5-7920df69edc6.png)

If the problem would be solved by running `terraform apply` again,
please merge the created pull request.

If any code fix is needed, please add commits to the created pull request and merge it.

Pull Requests are created per failed job.
For example, if two jobs failed, two pull requests would be created.
