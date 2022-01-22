# Create a pull request automatically to handle the problem when apply failed

Sometimes `terraform apply` fails even if `terraform plan` passed.
In that case, tfaction automatically creates a pull request with an empty commit to fix the failure.

![image](https://user-images.githubusercontent.com/13323303/150639029-340a397d-375e-4053-b8fa-138d19e6b468.png)

![image](https://user-images.githubusercontent.com/13323303/150639055-273935fe-dd2a-4e18-9dac-3d18633a35de.png)

If the problem would be solved by running `terraform apply` again,
please merge the created pull request.

If any code fix is needed, please add commits to the created pull request and merge it.

Pull Requests are created per failed job.
For example, if two jobs failed, two pull requests would be created.
