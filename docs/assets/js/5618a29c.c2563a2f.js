"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[4387],{3905:(e,t,r)=>{r.d(t,{Zo:()=>p,kt:()=>_});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function s(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var l=n.createContext({}),c=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},p=function(e){var t=c(e.components);return n.createElement(l.Provider,{value:t},e.children)},m="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,l=e.parentName,p=s(e,["components","mdxType","originalType","parentName"]),m=c(r),f=a,_=m["".concat(l,".").concat(f)]||m[f]||u[f]||o;return r?n.createElement(_,i(i({ref:t},p),{},{components:r})):n.createElement(_,i({ref:t},p))}));function _(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,i=new Array(o);i[0]=f;var s={};for(var l in t)hasOwnProperty.call(t,l)&&(s[l]=t[l]);s.originalType=e,s[m]="string"==typeof e?e:a,i[1]=s;for(var c=2;c<o;c++)i[c]=r[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},5916:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>l,contentTitle:()=>i,default:()=>u,frontMatter:()=>o,metadata:()=>s,toc:()=>c});var n=r(7462),a=(r(7294),r(3905));const o={sidebar_position:200},i="tfaction-root.yaml",s={unversionedId:"config/tfaction-root-yaml",id:"config/tfaction-root-yaml",title:"tfaction-root.yaml",description:"* JSON Schema",source:"@site/docs/config/tfaction-root-yaml.md",sourceDirName:"config",slug:"/config/tfaction-root-yaml",permalink:"/tfaction/docs/config/tfaction-root-yaml",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/config/tfaction-root-yaml.md",tags:[],version:"current",sidebarPosition:200,frontMatter:{sidebar_position:200},sidebar:"tutorialSidebar",previous:{title:"How to add a working directory",permalink:"/tfaction/docs/config/add-working-directory"},next:{title:"tfaction.yaml",permalink:"/tfaction/docs/config/tfaction-yaml"}},l={},c=[{value:"<code>plan_workflow_name</code>",id:"plan_workflow_name",level:2},{value:"<code>target</code> and <code>working_directory</code>",id:"target-and-working_directory",level:2},{value:"<code>target_groups</code>",id:"target_groups",level:2},{value:"Example",id:"example",level:2}],p={toc:c},m="wrapper";function u(e){let{components:t,...r}=e;return(0,a.kt)(m,(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"tfaction-rootyaml"},"tfaction-root.yaml"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/schema/tfaction-root.json"},"JSON Schema")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://suzuki-shunsuke.github.io/tfaction/config/tfaction-root.html"},"Generated document from JSON Schema"))),(0,a.kt)("h2",{id:"plan_workflow_name"},(0,a.kt)("inlineCode",{parentName:"h2"},"plan_workflow_name")),(0,a.kt)("p",null,"From tfaction v0.7.0, this setting is required."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-yaml"},"plan_workflow_name: <GitHub Actions Workflow name running terraform-plan action>\n")),(0,a.kt)("p",null,"e.g."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-yaml"},"plan_workflow_name: test\n")),(0,a.kt)("h2",{id:"target-and-working_directory"},(0,a.kt)("inlineCode",{parentName:"h2"},"target")," and ",(0,a.kt)("inlineCode",{parentName:"h2"},"working_directory")),(0,a.kt)("p",null,"tfaction assumes that there are multiple working directories in the repository.\nWorking directory is a directory where terraform commands such as ",(0,a.kt)("inlineCode",{parentName:"p"},"terraform init"),", ",(0,a.kt)("inlineCode",{parentName:"p"},"terraform plan"),", and ",(0,a.kt)("inlineCode",{parentName:"p"},"terraform apply")," are run.\ntfaction treats directories where ",(0,a.kt)("inlineCode",{parentName:"p"},"tfaction.yaml")," is located as working directories.\nWorking directory has an attribute ",(0,a.kt)("inlineCode",{parentName:"p"},"target"),", which is an identifier of the working directory. ",(0,a.kt)("inlineCode",{parentName:"p"},"target")," must be unique.\n",(0,a.kt)("inlineCode",{parentName:"p"},"target")," is used in pull request comments and labels and the input of ",(0,a.kt)("a",{parentName:"p",href:"/feature/scaffold-working-dir"},"scaffold working directory"),".\nThe attribute ",(0,a.kt)("inlineCode",{parentName:"p"},"working_directory")," of the working directory is a relative file path to the working directory."),(0,a.kt)("h2",{id:"target_groups"},(0,a.kt)("inlineCode",{parentName:"h2"},"target_groups")),(0,a.kt)("p",null,(0,a.kt)("inlineCode",{parentName:"p"},"target_groups")," is a list of target group configuration.\ntfaction searches the configuration of the working directory from ",(0,a.kt)("inlineCode",{parentName:"p"},"target_groups"),".\nTarget Group Configuration has attributes ",(0,a.kt)("inlineCode",{parentName:"p"},"working_directory")," and ",(0,a.kt)("inlineCode",{parentName:"p"},"target"),".\nIf the Target Group's ",(0,a.kt)("inlineCode",{parentName:"p"},"working_directory")," is the prefix of the working directory's ",(0,a.kt)("inlineCode",{parentName:"p"},"working_directory"),",\nor the Target Group's ",(0,a.kt)("inlineCode",{parentName:"p"},"target")," is the prefix of the working directory's ",(0,a.kt)("inlineCode",{parentName:"p"},"target"),",\nthe Target Group's configuration is used as the working directory's configuration and the search is stopped."),(0,a.kt)("p",null,"The order of ",(0,a.kt)("inlineCode",{parentName:"p"},"target_groups")," is important."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-yaml"},"target_groups:\n- working_directory: aws/\n  target: aws/\n  # ...\n- working_directory: aws/foo/ # This configuration is never used.\n  target: aws/foo/\n  # ...\n")),(0,a.kt)("h2",{id:"example"},"Example"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre",className:"language-yaml"},'---\nplan_workflow_name: test\n\ndraft_pr: true # default is false. If `draft_pr` is true, tfaction creates pull requests as draft\nbase_working_directory: "" # default is empty, which means the current directory\nworking_directory_file: tfaction.yaml # default is "tfaction.yaml"\nrenovate_login: \'renovate[bot]\' # default is "renovate[bot]"\nlabel_prefixes:\n  target: "target:" # default is "target:"\n  tfmigrate: "tfmigrate:" # default is "tfmigrate:"\n  skip: "skip:" # default is "skip:"\n\naqua:\n  update_checksum:\n    # Update aqua-checksums.json in `setup` action\n    enabled: true # default is false\n    skip_push: false # default is false\n    prune: true # default is false\n\n# https://github.com/suzuki-shunsuke/tfaction/pull/1106\n# tfsec:\n#   enabled: true\n# tflint:\n#   enabled: true\n# trivy:\n#   enabled: false\n\n# We don\'t recommend disabling this feature.\n# update_related_pull_requests:\n#   enabled: false\n\n# tfaction >= v0.5.25\n# https://github.com/suzuki-shunsuke/tfaction/pull/910\n# scaffold_working_directory:\n#   skip_adding_aqua_packages: true\n\n# tfaction >= v0.6.0\ndrift_detection:\n  enabled: false\n  issue_repo_owner: suzuki-shunsuke\n  issue_repo_name: tfaction-example\n  num_of_issues: 1\n  minimum_detection_interval: 1\n\ntarget_groups:\n- working_directory: aws/\n  target: aws/\n  aws_region: ap-northeast-1\n  s3_bucket_name_tfmigrate_history: \'<S3 Bucket Name for tfmigrate history files>\'\n  template_dir: templates/aws # This is used by `scaffold-working-dir` action\n  drift_detection:\n    enabled: true\n  terraform_plan_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_plan\n  tfmigrate_plan_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_plan\n  terraform_apply_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_terraform_apply\n  tfmigrate_apply_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_AWS_tfmigrate_apply\n\n- working_directory: github/services/\n  target: github/\n  aws_region: ap-northeast-1\n  s3_bucket_name_tfmigrate_history: \'<S3 Bucket Name for tfmigrate history files>\'\n  template_dir: templates/github\n  aws_secrets_manager:\n  # export AWS Secrets Manager\'s secret as environment variable\n  - secret_id: bar\n    envs:\n    - env_name: BAR\n  terraform_plan_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_terraform_plan\n  tfmigrate_plan_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_tfmigrate_plan\n  terraform_apply_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_terraform_apply\n    aws_secrets_manager:\n    # export AWS Secrets Manager\'s secret as environment variable\n    - secret_id: atlas_api_key\n      envs:\n      - env_name: ATLAS_API_PUBLIC_KEY\n        secret_key: public_key\n      - env_name: ATLAS_API_PRIVATE_KEY\n        secret_key: private_key\n  tfmigrate_apply_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_github_tfmigrate_apply\n\n- working_directory: gcp/\n  target: gcp/\n  aws_region: ap-northeast-1\n  template_dir: templates/github\n  runs_on: ubuntu-latest # default is "ubuntu-latest". This is useful to use GitHub Actions Self Hosted Runner for the specific provider\n  environment: # default is null\n    # https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment\n    name: production\n    url: https://github.com\n  secrets: # GitHub Secrets\n  - env_name: FOO # Environment variable name\n    secret_name: FOO_STAGING # Secret name\n\n  gcs_bucket_name_tfmigrate_history: \'<Google Cloud Storage Bucket Name for tfmigrate history files>\'\n  terraform_plan_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_terraform_plan\n    gcp_service_account: terraform@my-project.iam.gserviceaccount.com\n    gcp_workload_identity_provider: \'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider\'\n  tfmigrate_plan_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_tfmigrate_plan\n    gcp_service_account: terraform@my-project.iam.gserviceaccount.com\n    gcp_workload_identity_provider: \'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider\'\n  terraform_apply_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_terraform_apply\n    gcp_service_account: terraform@my-project.iam.gserviceaccount.com\n    gcp_workload_identity_provider: \'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider\'\n  tfmigrate_apply_config:\n    aws_assume_role_arn: arn:aws:iam::000000000000:role/GitHubActions_Terraform_gcp_tfmigrate_apply\n    gcp_service_account: terraform@my-project.iam.gserviceaccount.com\n    gcp_workload_identity_provider: \'projects/123456789/locations/global/workloadIdentityPools/my-pool/providers/my-provider\'\n')))}u.isMDXComponent=!0}}]);