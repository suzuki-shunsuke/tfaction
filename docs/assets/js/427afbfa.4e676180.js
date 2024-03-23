"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[110],{4157:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>a,contentTitle:()=>s,default:()=>p,frontMatter:()=>i,metadata:()=>c,toc:()=>l});var o=n(4848),r=n(8453);const i={sidebar_position:600},s="Validate Terraform Plan Result with Conftest",c={id:"feature/conftest",title:"Validate Terraform Plan Result with Conftest",description:"About Conftest, please see https://www.conftest.dev/ .",source:"@site/docs/feature/conftest.md",sourceDirName:"feature",slug:"/feature/conftest",permalink:"/tfaction/docs/feature/conftest",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/conftest.md",tags:[],version:"current",sidebarPosition:600,frontMatter:{sidebar_position:600},sidebar:"tutorialSidebar",previous:{title:"Manage Terraform Modules",permalink:"/tfaction/docs/feature/module"},next:{title:"Support skipping terraform plan and terraform apply in case of pull request by Renovate",permalink:"/tfaction/docs/feature/support-skipping-terraform-renovate-pr"}},a={},l=[{value:"Policy directory",id:"policy-directory",level:2}];function d(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",p:"p",pre:"pre",...(0,r.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.h1,{id:"validate-terraform-plan-result-with-conftest",children:"Validate Terraform Plan Result with Conftest"}),"\n",(0,o.jsxs)(t.p,{children:["About Conftest, please see ",(0,o.jsx)(t.a,{href:"https://www.conftest.dev/",children:"https://www.conftest.dev/"})," ."]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.a,{href:"https://www.openpolicyagent.org/docs/latest/terraform/",children:"https://www.openpolicyagent.org/docs/latest/terraform/"})}),"\n",(0,o.jsx)(t.p,{children:"tfaction supports validating Terraform Plan Result with Conftest."}),"\n",(0,o.jsx)(t.p,{children:"If Terraform Plan Result violate your Conftest Policy, the violation is notified as Pull Request Comment."}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/150035710-249c4cbd-47fa-46d7-ae0d-28ab4ace1a64.png",alt:"image"})}),"\n",(0,o.jsx)(t.p,{children:"tfaction doesn't provide any Conftest Policy. Please write your Conftest Policy freely."}),"\n",(0,o.jsx)(t.p,{children:"We recommend writing the document about Conftest Policy per policy."}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{children:"github-comment.yaml\npolicy/\n  github_issue_label_description.rego # Policy\n  github_issue_label_description_test.rego # Policy Test\n  github_issue_label_description.md # Policy Document\n"})}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/150035773-1702fba7-5058-412f-b41c-f69793237dd7.png",alt:"image"})}),"\n",(0,o.jsx)(t.h2,{id:"policy-directory",children:"Policy directory"}),"\n",(0,o.jsx)(t.p,{children:"tfaction >= v1.1.0"}),"\n",(0,o.jsxs)(t.p,{children:["You can change the directory by the setting ",(0,o.jsx)(t.code,{children:"conftest_policy_directory"})," in tfaction-root.yaml."]}),"\n",(0,o.jsx)(t.p,{children:"e.g. tfaction-root.yaml"}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:"language-yaml",children:"conftest_policy_directory: terraform/policy\n"})}),"\n",(0,o.jsxs)(t.p,{children:['The default value is "policy".\nIf ',(0,o.jsx)(t.code,{children:"conftest_policy_directory"})," isn't set and the directory policy doesn't exist, contest is skipped.\nIf ",(0,o.jsx)(t.code,{children:"conftest_policy_directory"})," is set but the directory doesn't exist, the action fails."]})]})}function p(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(d,{...e})}):d(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>s,x:()=>c});var o=n(6540);const r={},i=o.createContext(r);function s(e){const t=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),o.createElement(i.Provider,{value:t},e.children)}}}]);