"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[110],{7756:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>r,contentTitle:()=>c,default:()=>h,frontMatter:()=>o,metadata:()=>l,toc:()=>d});var t=s(4848),i=s(8453);const o={sidebar_position:600},c="Conftest",l={id:"feature/conftest",title:"Conftest",description:"Conftest support was improved at tfaction v1.8.0.",source:"@site/docs/feature/conftest.md",sourceDirName:"feature",slug:"/feature/conftest",permalink:"/tfaction/docs/feature/conftest",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/conftest.md",tags:[],version:"current",sidebarPosition:600,frontMatter:{sidebar_position:600},sidebar:"tutorialSidebar",previous:{title:"Manage Terraform Modules",permalink:"/tfaction/docs/feature/module"},next:{title:"Support skipping terraform plan and terraform apply in case of pull request by Renovate",permalink:"/tfaction/docs/feature/support-skipping-terraform-renovate-pr"}},r={},d=[{value:"Settings",id:"settings",level:2},{value:"conftest_policy_directory",id:"conftest_policy_directory",level:3},{value:"conftest",id:"conftest-1",level:3},{value:"Example",id:"example",level:2}];function a(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",h3:"h3",header:"header",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.header,{children:(0,t.jsx)(n.h1,{id:"conftest",children:"Conftest"})}),"\n",(0,t.jsx)(n.admonition,{type:"info",children:(0,t.jsxs)(n.p,{children:["Conftest support was improved at tfaction ",(0,t.jsx)(n.a,{href:"https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.8.0",children:"v1.8.0"}),"."]})}),"\n",(0,t.jsxs)(n.p,{children:["About Conftest, please see ",(0,t.jsx)(n.a,{href:"https://www.conftest.dev/",children:"https://www.conftest.dev/"})," ."]}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.a,{href:"https://www.openpolicyagent.org/docs/latest/terraform/",children:"https://www.openpolicyagent.org/docs/latest/terraform/"})}),"\n",(0,t.jsx)(n.p,{children:"tfaction supports validating files using Conftest.\nAny violation is notified as pull request comment."}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:"https://user-images.githubusercontent.com/13323303/150035710-249c4cbd-47fa-46d7-ae0d-28ab4ace1a64.png",alt:"image"})}),"\n",(0,t.jsx)(n.p,{children:"tfaction doesn't provide any Conftest Policy. Please write your Conftest Policy freely."}),"\n",(0,t.jsx)(n.p,{children:"We recommend writing the document about Conftest Policy per policy."}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{children:"policy/\n  github_issue_label_description.rego # Policy\n  github_issue_label_description_test.rego # Policy Test\n  github_issue_label_description.md # Policy Document\n"})}),"\n",(0,t.jsx)(n.p,{children:(0,t.jsx)(n.img,{src:"https://user-images.githubusercontent.com/13323303/150035773-1702fba7-5058-412f-b41c-f69793237dd7.png",alt:"image"})}),"\n",(0,t.jsx)(n.h2,{id:"settings",children:"Settings"}),"\n",(0,t.jsxs)(n.p,{children:["By default, tfaction runs Conftest if the directory ",(0,t.jsx)(n.code,{children:"policy"})," exists in the repository root directory."]}),"\n",(0,t.jsx)(n.h3,{id:"conftest_policy_directory",children:"conftest_policy_directory"}),"\n",(0,t.jsxs)(n.p,{children:["tfaction >= ",(0,t.jsx)(n.a,{href:"https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.1.0",children:"v1.1.0"}),":"]}),"\n",(0,t.jsxs)(n.p,{children:["You can change the directory by the setting ",(0,t.jsx)(n.code,{children:"conftest_policy_directory"})," in ",(0,t.jsx)(n.code,{children:"tfaction-root.yaml"}),"."]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"conftest_policy_directory: terraform/policy\n"})}),"\n",(0,t.jsxs)(n.admonition,{type:"info",children:[(0,t.jsxs)(n.p,{children:["If you configure the ",(0,t.jsx)(n.code,{children:"conftest"})," field, ",(0,t.jsx)(n.code,{children:"conftest_policy_directory"})," is ignored.\nYou should migrate ",(0,t.jsx)(n.code,{children:"conftest_policy_directory"})," to ",(0,t.jsx)(n.code,{children:"conftest"}),"."]}),(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"conftest:\n  - policy: terraform/policy\n    plan: true\n"})})]}),"\n",(0,t.jsx)(n.h3,{id:"conftest-1",children:"conftest"}),"\n",(0,t.jsxs)(n.p,{children:["tfaction >= ",(0,t.jsx)(n.a,{href:"https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.8.0",children:"v1.8.0"}),":"]}),"\n",(0,t.jsx)(n.p,{children:"You can configure policies at three layers."}),"\n",(0,t.jsxs)(n.ol,{children:["\n",(0,t.jsx)(n.li,{children:"tfaction.yaml"}),"\n",(0,t.jsx)(n.li,{children:"target_group in tfaction-root.yaml"}),"\n",(0,t.jsx)(n.li,{children:"root in tfaction-root.yaml"}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"tfaction-root.yaml:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"conftest:\n  policies:\n    - policy: policy/plan\n      plan: true\n      id: plan\ntarget_groups:\n  - working_directory: aws/\n    # ...\n    conftest:\n      disable_all: true\n      # ...\n"})}),"\n",(0,t.jsx)(n.p,{children:"tfaction.yaml:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"conftest:\n  policies:\n    - id: plan\n      enabled: false\n    - policy: policy/combine/tf\n      tf: true\n      combine: true\n      data: data\n"})}),"\n",(0,t.jsxs)(n.p,{children:["Basically, tfaction joins ",(0,t.jsx)(n.code,{children:"conftest.policies"})," and runs ",(0,t.jsx)(n.code,{children:"conftest test"})," by policy.\nUsing ",(0,t.jsx)(n.code,{children:"id"})," field, you can also overwrite the existing policy."]}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"conftest"}),":"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"disable_all"}),": Boolean. If this is true, settings in previous layers are disabled"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"policies"}),": A list of policies"]}),"\n"]}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"conftest.policies[]"}),":"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["tfaction specific options:","\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"id"}),": unique id of policy. This is optional. This is used to overwrite the setting"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"plan"}),": boolean. Whether this policy is for plan files. The default is false"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"tf"}),": boolean. Whether this policy is for *.tf and *.tf.json. The default is false"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"enabled"}),": boolean. Whether this policy is enabled. The default is true"]}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["conftest options:","\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"policy"}),": A list or a string of relative paths to a policy directory from the repository root directory"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"data"}),": A list or a string of conftest test's ",(0,t.jsx)(n.code,{children:"-data"})," option. A relative path to a data directory from the repository root directory"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"combine"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-combine"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"fail_on_warn"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-fail-on-warn"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"no_fail"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-no-fail"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"all_namespaces"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-all-namespaces"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"quiet"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-quiet"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"trace"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-trace"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"strict"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-strict"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"show_builtin_errors"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-show-builtin-errors"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"junit_hide_message"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-junit-hide-message"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"suppress_exceptions"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-suppress-exceptions"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"tls"}),": boolean. conftest test's ",(0,t.jsx)(n.code,{children:"-tls"})," option. The default is ",(0,t.jsx)(n.code,{children:"false"})]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"parser"}),": string. conftest test's ",(0,t.jsx)(n.code,{children:"-parser"})," option"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"output"}),": string. conftest test's ",(0,t.jsx)(n.code,{children:"-output"})," option"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"namespaces"}),": A list of strings. conftest test's ",(0,t.jsx)(n.code,{children:"-namespace"})," option"]}),"\n"]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:[(0,t.jsx)(n.code,{children:"paths"}),": A list of tested file paths. ",(0,t.jsx)(n.a,{href:"https://www.npmjs.com/package/glob",children:"glob"})," is available."]}),"\n"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"conftest:\n  policies:\n    - policy: # array or string\n        - policy/terraform\n      data: # array or string\n        - data/data.yaml\n      fail_on_warn: true\n      no_fail: true\n      all_namespaces: true\n      quiet: true\n      trace: true\n      strict: true\n      show_builtin_errors: true\n      junit_hide_message: true\n      suppress_exceptions: true\n      tls: true\n      parser: hcl\n      output: json\n      namespaces:\n        - main\n"})}),"\n",(0,t.jsx)(n.h2,{id:"example",children:"Example"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:'conftest:\n  policies:\n    - policy: policy/tf\n      id: tf\n      tf: true\n    - policy: policy/combine/tf\n      combine: true\n      tf: true\n    - policy: policy/plan\n      plan: true\n    - policy: policy/tfaction\n      paths:\n        - tfaction.yaml\n    - policy: policy/json\n      paths:\n        - "*.json"\n'})}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"disable_all"}),":"]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"conftest:\n  disable_all: true # Disable settings of previous layers\n  policies:\n    - policy: policy/tf\n      tf: true\n"})}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.code,{children:"enabled: false"}),": Disable specific policies."]}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-yaml",children:"conftest:\n  policies:\n    - id: tf\n      enabled: false\n    - policy: policy/plan\n      plan: true\n"})})]})}function h(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(a,{...e})}):a(e)}},8453:(e,n,s)=>{s.d(n,{R:()=>c,x:()=>l});var t=s(6540);const i={},o=t.createContext(i);function c(e){const n=t.useContext(o);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:c(e.components),t.createElement(o.Provider,{value:n},e.children)}}}]);