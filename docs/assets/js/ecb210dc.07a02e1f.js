"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[999],{5680:(e,t,i)=>{i.d(t,{xA:()=>d,yg:()=>g});var n=i(6540);function a(e,t,i){return t in e?Object.defineProperty(e,t,{value:i,enumerable:!0,configurable:!0,writable:!0}):e[t]=i,e}function r(e,t){var i=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),i.push.apply(i,n)}return i}function l(e){for(var t=1;t<arguments.length;t++){var i=null!=arguments[t]?arguments[t]:{};t%2?r(Object(i),!0).forEach((function(t){a(e,t,i[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(i)):r(Object(i)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(i,t))}))}return e}function o(e,t){if(null==e)return{};var i,n,a=function(e,t){if(null==e)return{};var i,n,a={},r=Object.keys(e);for(n=0;n<r.length;n++)i=r[n],t.indexOf(i)>=0||(a[i]=e[i]);return a}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(n=0;n<r.length;n++)i=r[n],t.indexOf(i)>=0||Object.prototype.propertyIsEnumerable.call(e,i)&&(a[i]=e[i])}return a}var s=n.createContext({}),u=function(e){var t=n.useContext(s),i=t;return e&&(i="function"==typeof e?e(t):l(l({},t),e)),i},d=function(e){var t=u(e.components);return n.createElement(s.Provider,{value:t},e.children)},c="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},y=n.forwardRef((function(e,t){var i=e.components,a=e.mdxType,r=e.originalType,s=e.parentName,d=o(e,["components","mdxType","originalType","parentName"]),c=u(i),y=a,g=c["".concat(s,".").concat(y)]||c[y]||p[y]||r;return i?n.createElement(g,l(l({ref:t},d),{},{components:i})):n.createElement(g,l({ref:t},d))}));function g(e,t){var i=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var r=i.length,l=new Array(r);l[0]=y;var o={};for(var s in t)hasOwnProperty.call(t,s)&&(o[s]=t[s]);o.originalType=e,o[c]="string"==typeof e?e:a,l[1]=o;for(var u=2;u<r;u++)l[u]=i[u];return n.createElement.apply(null,l)}return n.createElement.apply(null,i)}y.displayName="MDXCreateElement"},9674:(e,t,i)=>{i.r(t),i.d(t,{assets:()=>s,contentTitle:()=>l,default:()=>p,frontMatter:()=>r,metadata:()=>o,toc:()=>u});var n=i(8168),a=(i(6540),i(5680));const r={sidebar_position:850},l="Drift Detection",o={unversionedId:"feature/drift-detection",id:"feature/drift-detection",title:"Drift Detection",description:"Check the drift periodically and track it using GitHub Issues",source:"@site/docs/feature/drift-detection.md",sourceDirName:"feature",slug:"/feature/drift-detection",permalink:"/tfaction/docs/feature/drift-detection",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/drift-detection.md",tags:[],version:"current",sidebarPosition:850,frontMatter:{sidebar_position:850},sidebar:"tutorialSidebar",previous:{title:"Auto Fix .terraform.lock.hcl and Terraform Configuration",permalink:"/tfaction/docs/feature/auto-fix"},next:{title:"Linters",permalink:"/tfaction/docs/feature/linter"}},s={},u=[{value:"Requirements",id:"requirements",level:2},{value:"Set up",id:"set-up",level:2},{value:"1. Update tfaciton-root.yaml",id:"1-update-tfaciton-rootyaml",level:3},{value:"2. Install tfaction-go by aqua",id:"2-install-tfaction-go-by-aqua",level:3},{value:"3. Add two GitHub Actions workflows",id:"3-add-two-github-actions-workflows",level:3},{value:"3.1. schedule-create-drift-issues.yaml",id:"31-schedule-create-drift-issuesyaml",level:4},{value:"3.2. schedule-detect-drifts.yaml",id:"32-schedule-detect-driftsyaml",level:4},{value:"3.3. sync-drift-issue-description.yaml",id:"33-sync-drift-issue-descriptionyaml",level:4},{value:"4. Update the apply workflow",id:"4-update-the-apply-workflow",level:3},{value:"5. Run <code>schedule-create-drift-issues.yaml</code> manually only once",id:"5-run-schedule-create-drift-issuesyaml-manually-only-once",level:3},{value:"Enable drift detection against only specific working directories",id:"enable-drift-detection-against-only-specific-working-directories",level:2},{value:"GitHub Access Token",id:"github-access-token",level:2},{value:"GitHub Issue&#39;s title",id:"github-issues-title",level:2},{value:"Adjust the frequency of Drift Detection",id:"adjust-the-frequency-of-drift-detection",level:2},{value:"How to handle issues",id:"how-to-handle-issues",level:2},{value:"How to save cost \ud83d\udcb0",id:"how-to-save-cost-",level:2}],d={toc:u},c="wrapper";function p(e){let{components:t,...i}=e;return(0,a.yg)(c,(0,n.A)({},d,i,{components:t,mdxType:"MDXLayout"}),(0,a.yg)("h1",{id:"drift-detection"},"Drift Detection"),(0,a.yg)("p",null,(0,a.yg)("em",{parentName:"p"},"Check the drift periodically and track it using GitHub Issues")),(0,a.yg)("p",null,(0,a.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png",alt:"image"})),(0,a.yg)("p",null,"tfaction >= v0.6.0"),(0,a.yg)("p",null,(0,a.yg)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/issues/851"},"#851")," ",(0,a.yg)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/pull/876"},"#876")),(0,a.yg)("p",null,"Blogs:"),(0,a.yg)("ul",null,(0,a.yg)("li",{parentName:"ul"},(0,a.yg)("a",{parentName:"li",href:"https://zenn.dev/shunsuke_suzuki/articles/tfaction-drift-detection"},"2023-06-05 tfaction \u306b\u3088\u308b Terraform \u306e Drift Detection")),(0,a.yg)("li",{parentName:"ul"},(0,a.yg)("a",{parentName:"li",href:"https://dev.to/suzukishunsuke/terraforms-drift-detection-by-tfaction-1dkh"},"2023-06-05 Terraform's Drift Detection by tfaction"))),(0,a.yg)("p",null,"Drift Detection is the feature to detect ",(0,a.yg)("inlineCode",{parentName:"p"},"drift"),". You can track the drift using GitHub Issues and resolve the drift continuously."),(0,a.yg)("admonition",{type:"caution"},(0,a.yg)("p",{parentName:"admonition"},"This feature detects ",(0,a.yg)("inlineCode",{parentName:"p"},"drift")," but doesn't resolve it automatically. You have to resolve it yourself.")),(0,a.yg)("p",null,"This feature is disabled by default. To enable this feature, please see ",(0,a.yg)("a",{parentName:"p",href:"#setup"},"Set up"),"."),(0,a.yg)("p",null,"tfaction creates GitHub Issues per working directory and manages each working directory's drift with GitHub Issues."),(0,a.yg)("p",null,(0,a.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/232356635-0772278e-fc07-4cb2-a48e-a0e97c1cfd10.png",alt:"image"})),(0,a.yg)("p",null,"tfaction opens an Issue when a drift is detected, and closes the Issue when the drift is resolved."),(0,a.yg)("p",null,"tfaction creates only one Issue per working directory and reuses the same issue.\nIf ",(0,a.yg)("inlineCode",{parentName:"p"},"drift")," is detected again after ",(0,a.yg)("inlineCode",{parentName:"p"},"drift")," is resolved once, tfaction reopens the same issue instead of creating a new issue."),(0,a.yg)("p",null,"tfaction checks if the drift exists at the following timing."),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},"A pull request is merged and ",(0,a.yg)("inlineCode",{parentName:"li"},"terraform apply")," or ",(0,a.yg)("inlineCode",{parentName:"li"},"tfmigrate apply")," are run"),(0,a.yg)("li",{parentName:"ol"},(0,a.yg)("inlineCode",{parentName:"li"},"terraform plan")," is run periodically by a dedicated GitHub Actions Workflow")),(0,a.yg)("p",null,"The result of ",(0,a.yg)("inlineCode",{parentName:"p"},"terraform apply"),", ",(0,a.yg)("inlineCode",{parentName:"p"},"tfmigrate apply"),", or ",(0,a.yg)("inlineCode",{parentName:"p"},"terraform plan")," is posted to the issue. The comment has links to the GitHub Actions Workflow and the pull request."),(0,a.yg)("p",null,"e.g. An Issue was opened because ",(0,a.yg)("inlineCode",{parentName:"p"},"terraform apply")," failed."),(0,a.yg)("p",null,(0,a.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/233077124-4db0f8a5-1f82-4abd-b0b4-fb641fcee85e.png",alt:"image"})),(0,a.yg)("p",null,"e.g. An Issue was closed because ",(0,a.yg)("inlineCode",{parentName:"p"},"terraform apply")," succeeded and the drift was resolved."),(0,a.yg)("p",null,(0,a.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/232356803-e1c7298f-362c-4f00-96f0-20f2ac8720f7.png",alt:"image"})),(0,a.yg)("p",null,"e.g. Drift is checked periodically."),(0,a.yg)("p",null,(0,a.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/233079030-67bd01cc-b6bf-425a-bdeb-82447a31904a.png",alt:"image"})),(0,a.yg)("p",null,(0,a.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png",alt:"image"})),(0,a.yg)("h2",{id:"requirements"},"Requirements"),(0,a.yg)("ul",null,(0,a.yg)("li",{parentName:"ul"},"tfaction >= v0.6.0"),(0,a.yg)("li",{parentName:"ul"},"tfaction-go >= v0.1.2"),(0,a.yg)("li",{parentName:"ul"},(0,a.yg)("strong",{parentName:"li"},"github-comment >= v5.2.1")),(0,a.yg)("li",{parentName:"ul"},(0,a.yg)("strong",{parentName:"li"},"tfcmt >= v4.3.0"))),(0,a.yg)("h2",{id:"set-up"},"Set up"),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},"Update tfaciton-root.yaml"),(0,a.yg)("li",{parentName:"ol"},"Install tfaction-go by aqua"),(0,a.yg)("li",{parentName:"ol"},"Add two GitHub Actions workflows"),(0,a.yg)("li",{parentName:"ol"},"Update the apply workflow"),(0,a.yg)("li",{parentName:"ol"},"Run ",(0,a.yg)("inlineCode",{parentName:"li"},"schedule-create-drift-issues.yaml")," manually only once")),(0,a.yg)("h3",{id:"1-update-tfaciton-rootyaml"},"1. Update tfaciton-root.yaml"),(0,a.yg)("p",null,"Please configure Drift Detection."),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-yaml"},"drift_detection: {} # Enable Drift Detection with the default settings\n")),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-yaml"},"drift_detection:\n  enabled: true\n  issue_repo_owner: suzuki-shunsuke # Repository owner of GitHub Issues. By default, Repository where GitHub Actions is run\n  issue_repo_name: tfaction-example # Repository name of GitHub Issues. By default, Repository where GitHub Actions is run\n  num_of_issues: 1 # The number of issues that scheduled job handles. The default value is `1`\n  minimum_detection_interval: 1 # The default value is 168 (7 days). The scheduled workflow picks out working directories whose issues were updated before `minimum_detection_interval` hours\n")),(0,a.yg)("p",null,"By default, drift issues are created in the same repository where tfaction is run.\nIf you change the repository, you have to use GitHub App token or personal access token instead of GitHub Actions token because GitHub Actions token can't access the other repository."),(0,a.yg)("h3",{id:"2-install-tfaction-go-by-aqua"},"2. Install tfaction-go by aqua"),(0,a.yg)("p",null,"Please install ",(0,a.yg)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction-go"},"tfaction-go")," in the repository root ",(0,a.yg)("inlineCode",{parentName:"p"},"aqua.yaml"),"."),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-console"},"$ aqua g -i suzuki-shunsuke/tfaction-go\n")),(0,a.yg)("h3",{id:"3-add-two-github-actions-workflows"},"3. Add two GitHub Actions workflows"),(0,a.yg)("p",null,"Please run these workflows periodically."),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},(0,a.yg)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/schedule-create-drift-issues.yaml"},"schedule-create-drift-issues.yaml"),": Create Drift Issues periodically"),(0,a.yg)("li",{parentName:"ol"},(0,a.yg)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/schedule-detect-drifts.yaml"},"schedule-detect-drifts.yaml"),": Test if each working directory has a drift periodically"),(0,a.yg)("li",{parentName:"ol"},"(Optional) ",(0,a.yg)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/sync-drift-issue-description.yaml"},"sync-drift-issue-description.yaml"),": Synchronize Drift Issue's description with the latest issue comment")),(0,a.yg)("h4",{id:"31-schedule-create-drift-issuesyaml"},"3.1. schedule-create-drift-issues.yaml"),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},"Create Issues"),(0,a.yg)("li",{parentName:"ol"},"Archive Issues whose working directories are not found")),(0,a.yg)("admonition",{type:"tip"},(0,a.yg)("p",{parentName:"admonition"},"This workflow closes issues immediately because drift detection isn't run against those working directories when issues are created.\nIssues will be reopened when the drift will be detected.")),(0,a.yg)("h4",{id:"32-schedule-detect-driftsyaml"},"3.2. schedule-detect-drifts.yaml"),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},"Pick out some Issues not checked recently and check the drift and updates Issues"),(0,a.yg)("li",{parentName:"ol"},"Archive Issues whose working directories are not found")),(0,a.yg)("p",null,(0,a.yg)("inlineCode",{parentName:"p"},"tfaction-root.yaml"),"'s following settings affect the workflow."),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-yaml"},"drift_detection:\n  num_of_issues: 1 # The maxmum number of issues that scheduled job handles. The default value is `1`\n  minimum_detection_interval: 1 # The default value is 168 (7 days). The scheduled workflow picks out working directories whose issues were updated before `minimum_detection_interval` hours\n")),(0,a.yg)("p",null,"This workflow picks out at most ",(0,a.yg)("inlineCode",{parentName:"p"},"num_of_issues")," working directories whose issues were updated before ",(0,a.yg)("inlineCode",{parentName:"p"},"minimum_detection_interval")," hours and checks if they have drifts."),(0,a.yg)("p",null,"The pseudo query to pick out issues is like the following."),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre"},'repo:${repo} "Terraform Drift" in:title sort:updated-asc updated:<${now - minimum_detection_interval(hour)}\n')),(0,a.yg)("p",null,"This means if all drift issues were updated within ",(0,a.yg)("inlineCode",{parentName:"p"},"minimum_detection_interval")," hours from now, no working directory aren't picked out."),(0,a.yg)("admonition",{type:"tip"},(0,a.yg)("p",{parentName:"admonition"},"Why is the parameter ",(0,a.yg)("inlineCode",{parentName:"p"},"minimum_detection_interval")," needed?\nThat is because the drift is checked by not only scheduled workflow but also apply workflow.\nIf the apply workflow is run recently against a working directory, the scheduled workflow doesn't have to check the same working directory.\nSo tfaction updates drift issues by not only the scheduled workflow but also the apply workflow, and restricts the target of the scheduled workflow by issue's last updated time and ",(0,a.yg)("inlineCode",{parentName:"p"},"minimum_detection_interval"),".")),(0,a.yg)("h4",{id:"33-sync-drift-issue-descriptionyaml"},"3.3. sync-drift-issue-description.yaml"),(0,a.yg)("p",null,"If you want to reflect the latest drift detection's result to drift issue's description, please add the workflow to the repository drift issues are created."),(0,a.yg)("p",null,(0,a.yg)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/sync-drift-issue-description.yaml"},"sync-drift-issue-description.yaml")," \u26a0\ufe0f Please change ",(0,a.yg)("inlineCode",{parentName:"p"},"github.actor")," properly"),(0,a.yg)("p",null,"This workflow is optional."),(0,a.yg)("p",null,(0,a.yg)("img",{parentName:"p",src:"https://github.com/suzuki-shunsuke/tfaction-docs/assets/13323303/2e95f528-8c5d-410c-8dec-fe0dabd3e85a",alt:"image"})),(0,a.yg)("h3",{id:"4-update-the-apply-workflow"},"4. Update the apply workflow"),(0,a.yg)("p",null,"Please add some steps to ",(0,a.yg)("inlineCode",{parentName:"p"},"terraform-apply")," and ",(0,a.yg)("inlineCode",{parentName:"p"},"tfmigrate-apply")," jobs."),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},"Run ",(0,a.yg)("inlineCode",{parentName:"li"},"tfaction get-or-create-drift-issue")," before ",(0,a.yg)("inlineCode",{parentName:"li"},"tfaction/setup"))),(0,a.yg)("p",null,(0,a.yg)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/e8688924120f65c48839850a980feb241ac80dd8/.github/workflows/apply.yaml#L65-L68"},"example")),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-yaml"},"- run: tfaction get-or-create-drift-issue\n  shell: bash\n  env:\n    GITHUB_TOKEN: ${{ github.token }}\n\n- uses: suzuki-shunsuke/tfaction/setup@v0.6.0\n")),(0,a.yg)("p",null,"This step gets a drift issue for the working directory.\nIf a drift issue isn't found, a new issue is created.\nThe environment variables about the drift issue are set."),(0,a.yg)("ol",{start:2},(0,a.yg)("li",{parentName:"ol"},"Run ",(0,a.yg)("inlineCode",{parentName:"li"},"tfaction/update-drift-issue")," in the end of the jobs. Set ",(0,a.yg)("inlineCode",{parentName:"li"},"if: always()")," to run the step definitely.")),(0,a.yg)("p",null,(0,a.yg)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/e8688924120f65c48839850a980feb241ac80dd8/.github/workflows/apply.yaml#L84-L88"},"example")),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-yaml"},"- uses: suzuki-shunsuke/tfaction/update-drift-issue@v0.6.0\n  if: always()\n  with:\n    status: ${{job.status}}\n    github_token: ${{steps.generate_token.outputs.token}}\n")),(0,a.yg)("p",null,"This step closes or reopens the drift issue according to the job result.\nIf the job fails the issue is reopened. Or if the job succeeds the issue is closed."),(0,a.yg)("admonition",{type:"caution"},(0,a.yg)("p",{parentName:"admonition"},"You have to update tfaction of all steps to v0.6.0 or later. If old tfaction is used in other steps drift detection doesn't work well.")),(0,a.yg)("h3",{id:"5-run-schedule-create-drift-issuesyaml-manually-only-once"},"5. Run ",(0,a.yg)("inlineCode",{parentName:"h3"},"schedule-create-drift-issues.yaml")," manually only once"),(0,a.yg)("p",null,"Drift Detection doesn't work well if GitHub Issues don't exist. So please run the workflow manually to create issues only once."),(0,a.yg)("h2",{id:"enable-drift-detection-against-only-specific-working-directories"},"Enable drift detection against only specific working directories"),(0,a.yg)("p",null,"By default Drift Detection is enabled against all working directories, but you can enable Drift Detection against only specific working directories."),(0,a.yg)("p",null,"The priority is as following."),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},"tfaction.yaml's ",(0,a.yg)("inlineCode",{parentName:"li"},"drift_detection")),(0,a.yg)("li",{parentName:"ol"},"target group's ",(0,a.yg)("inlineCode",{parentName:"li"},"drift_detection")),(0,a.yg)("li",{parentName:"ol"},"tfaction-root.yaml's ",(0,a.yg)("inlineCode",{parentName:"li"},"drift_detection"))),(0,a.yg)("p",null,"e.g."),(0,a.yg)("p",null,"tfaction-root.yaml"),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-yaml"},"drift_detection:\n  enabled: false\n\ntarget_groups:\n- working_directory: aws/\n  # ...\n  drift_detection:\n    enabled: true\n")),(0,a.yg)("p",null,"tfaction.yaml"),(0,a.yg)("pre",null,(0,a.yg)("code",{parentName:"pre",className:"language-yaml"},"drift_detection:\n  enabled: false\n")),(0,a.yg)("h2",{id:"github-access-token"},"GitHub Access Token"),(0,a.yg)("p",null,"The permission ",(0,a.yg)("inlineCode",{parentName:"p"},"issues: write")," is required to update GitHub Issues."),(0,a.yg)("h2",{id:"github-issues-title"},"GitHub Issue's title"),(0,a.yg)("p",null,"Please don't change GitHub Issue's title basically because tfaction identifies issues using the title.\nThe title must be unique."),(0,a.yg)("p",null,"If you change a target name of a working directory and you want to keep using the same drift issue,\nplease change the issue title properly. Otherwise, tfaction will close the issue and create a new issue."),(0,a.yg)("h2",{id:"adjust-the-frequency-of-drift-detection"},"Adjust the frequency of Drift Detection"),(0,a.yg)("p",null,"Please adjust the frequency of Drift Detection as you like."),(0,a.yg)("ul",null,(0,a.yg)("li",{parentName:"ul"},"The schedule of GitHub Actions Workflow"),(0,a.yg)("li",{parentName:"ul"},"Drift Detection's configuration",(0,a.yg)("ul",{parentName:"li"},(0,a.yg)("li",{parentName:"ul"},"num_of_issues"),(0,a.yg)("li",{parentName:"ul"},"minimum_detection_interval")))),(0,a.yg)("p",null,"This depends on the number of working directories. Please pay attention to the cost and API rate limiting if you increase the frequency."),(0,a.yg)("p",null,"The following table shows the example."),(0,a.yg)("table",null,(0,a.yg)("thead",{parentName:"table"},(0,a.yg)("tr",{parentName:"thead"},(0,a.yg)("th",{parentName:"tr",align:null},"No."),(0,a.yg)("th",{parentName:"tr",align:null},"the number of working directory"),(0,a.yg)("th",{parentName:"tr",align:null},"frequency of workflow"),(0,a.yg)("th",{parentName:"tr",align:null},(0,a.yg)("inlineCode",{parentName:"th"},"num_of_issues")),(0,a.yg)("th",{parentName:"tr",align:null},"frequency per working directory (/ 1 times)"))),(0,a.yg)("tbody",{parentName:"table"},(0,a.yg)("tr",{parentName:"tbody"},(0,a.yg)("td",{parentName:"tr",align:null},"1"),(0,a.yg)("td",{parentName:"tr",align:null},"10"),(0,a.yg)("td",{parentName:"tr",align:null},"1 / hour"),(0,a.yg)("td",{parentName:"tr",align:null},"1"),(0,a.yg)("td",{parentName:"tr",align:null},"10 hour")),(0,a.yg)("tr",{parentName:"tbody"},(0,a.yg)("td",{parentName:"tr",align:null},"2"),(0,a.yg)("td",{parentName:"tr",align:null},"7"),(0,a.yg)("td",{parentName:"tr",align:null},"1 / day"),(0,a.yg)("td",{parentName:"tr",align:null},"1"),(0,a.yg)("td",{parentName:"tr",align:null},"1 week")),(0,a.yg)("tr",{parentName:"tbody"},(0,a.yg)("td",{parentName:"tr",align:null},"3"),(0,a.yg)("td",{parentName:"tr",align:null},"1000"),(0,a.yg)("td",{parentName:"tr",align:null},"1 / 30 min"),(0,a.yg)("td",{parentName:"tr",align:null},"3"),(0,a.yg)("td",{parentName:"tr",align:null},"1 week")))),(0,a.yg)("h2",{id:"how-to-handle-issues"},"How to handle issues"),(0,a.yg)("p",null,"Even if issues are created by Drift Detection,\nthere is no meaning if you don't resolve them."),(0,a.yg)("p",null,"How to use this feature is completely up to you, but we have some advices."),(0,a.yg)("ul",null,(0,a.yg)("li",{parentName:"ul"},"Don't handle all issues by only you. Handle issues by teams"),(0,a.yg)("li",{parentName:"ul"},"Create a strategy to handle issues continuously"),(0,a.yg)("li",{parentName:"ul"},"Create rules to handle issues and write a guide so that everyon can handle issues properly"),(0,a.yg)("li",{parentName:"ul"},"Rotate person in charge of handling issues"),(0,a.yg)("li",{parentName:"ul"},"Leave the issue handling to each working directory's owners"),(0,a.yg)("li",{parentName:"ul"},"Review and improve the issue handling periodically")),(0,a.yg)("p",null,"The real time notification to the chat tool may be noisy and exhaust you, so we recommend making the time to check issues periodically (e.g. daily or weekly) rather than the real time notification."),(0,a.yg)("h2",{id:"how-to-save-cost-"},"How to save cost \ud83d\udcb0"),(0,a.yg)("p",null,"If you want to save cost, there are some options."),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},"Decrease the frequency of ",(0,a.yg)("inlineCode",{parentName:"li"},"schedule-detect-drifts")," workflow"),(0,a.yg)("li",{parentName:"ol"},"Stop running ",(0,a.yg)("inlineCode",{parentName:"li"},"schedule-detect-drifts")," workflow. Even if ",(0,a.yg)("inlineCode",{parentName:"li"},"schedule-detect-drifts")," is stopped, drift issues are updated according to the result of ",(0,a.yg)("inlineCode",{parentName:"li"},"terraform apply")," and ",(0,a.yg)("inlineCode",{parentName:"li"},"tfmigrate apply"),". Maybe this is enough useful"),(0,a.yg)("li",{parentName:"ol"},"Use GitHub Actions Self hosted runner")))}p.isMDXComponent=!0}}]);