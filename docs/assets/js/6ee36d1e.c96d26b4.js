"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[588],{3107:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>c,contentTitle:()=>i,default:()=>u,frontMatter:()=>a,metadata:()=>s,toc:()=>d});var o=t(4848),n=t(8453);const a={sidebar_position:1110},i="Use a Terraform compatible tool",s={id:"feature/use-terraform-compatible-tool",title:"Use a Terraform compatible tool",description:"#1554 tfaction >= v1.2.0",source:"@site/docs/feature/use-terraform-compatible-tool.md",sourceDirName:"feature",slug:"/feature/use-terraform-compatible-tool",permalink:"/tfaction/docs/feature/use-terraform-compatible-tool",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/use-terraform-compatible-tool.md",tags:[],version:"current",sidebarPosition:1110,frontMatter:{sidebar_position:1110},sidebar:"tutorialSidebar",previous:{title:"Destroy resources",permalink:"/tfaction/docs/feature/destroy"},next:{title:"Run CI on working directories that depend on a updated local path Module",permalink:"/tfaction/docs/feature/local-path-module"}},c={},d=[{value:"Overview",id:"overview",level:2},{value:"How to use",id:"how-to-use",level:2},{value:"\ud83d\udca1 Combine OpenTofu and Terragrunt",id:"-combine-opentofu-and-terragrunt",level:2},{value:"\ud83d\udca1 Validate <code>terraform_command</code>",id:"-validate-terraform_command",level:2}];function l(e){const r={a:"a",code:"code",h1:"h1",h2:"h2",li:"li",ol:"ol",p:"p",pre:"pre",...(0,n.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(r.h1,{id:"use-a-terraform-compatible-tool",children:"Use a Terraform compatible tool"}),"\n",(0,o.jsxs)(r.p,{children:[(0,o.jsx)(r.a,{href:"https://github.com/suzuki-shunsuke/tfaction/pull/1554",children:"#1554"})," tfaction >= ",(0,o.jsx)(r.a,{href:"https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.2.0",children:"v1.2.0"})]}),"\n",(0,o.jsx)(r.h2,{id:"overview",children:"Overview"}),"\n",(0,o.jsxs)(r.p,{children:["tfaction executes Terraform commands such as terraform init, fmt, validate, plan, apply, and so on.\nYou can also execute any tools compatible with Terraform instead of Terraform.\nYou can use tools such as ",(0,o.jsx)(r.a,{href:"https://opentofu.org/",children:"OpenTofu"})," and ",(0,o.jsx)(r.a,{href:"https://terragrunt.gruntwork.io/",children:"Terragrunt"})," instead of Terraform."]}),"\n",(0,o.jsx)(r.h2,{id:"how-to-use",children:"How to use"}),"\n",(0,o.jsxs)(r.p,{children:["You can specify a tool by the setting ",(0,o.jsx)(r.code,{children:"terraform_command"})," in ",(0,o.jsx)(r.code,{children:"tfaction-root.yaml"})," and ",(0,o.jsx)(r.code,{children:"tfaction.yaml"}),"."]}),"\n",(0,o.jsx)(r.p,{children:"tfaction-root.yaml"}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-yaml",children:"terraform_command: tofu # terragrunt\ntarget_groups:\n  - working_directory: aws/\n    terraform_command: tofu # terragrunt\n"})}),"\n",(0,o.jsx)(r.p,{children:"tfaction.yaml"}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-yaml",children:"terraform_command: tofu # terragrunt\n"})}),"\n",(0,o.jsxs)(r.p,{children:["Then the given command is executed instead of ",(0,o.jsx)(r.code,{children:"terraform"}),".\nFor example, if ",(0,o.jsx)(r.code,{children:"terraform_command"})," is ",(0,o.jsx)(r.code,{children:"tofu"}),", commands such as tofu init, fmt, validate, plan, apply are executed instead of terraform."]}),"\n",(0,o.jsx)(r.h2,{id:"-combine-opentofu-and-terragrunt",children:"\ud83d\udca1 Combine OpenTofu and Terragrunt"}),"\n",(0,o.jsx)(r.p,{children:"You can also combine OpenTofu and Terragrunt."}),"\n",(0,o.jsxs)(r.ol,{children:["\n",(0,o.jsxs)(r.li,{children:["Set ",(0,o.jsx)(r.code,{children:"terraform_command"})," to ",(0,o.jsx)(r.code,{children:"terragrunt"})]}),"\n",(0,o.jsxs)(r.li,{children:["Set the environment variable ",(0,o.jsx)(r.code,{children:"TERRAGRUNT_TFPATH"})," to ",(0,o.jsx)(r.code,{children:"tofu"})]}),"\n"]}),"\n",(0,o.jsxs)(r.h2,{id:"-validate-terraform_command",children:["\ud83d\udca1 Validate ",(0,o.jsx)(r.code,{children:"terraform_command"})]}),"\n",(0,o.jsxs)(r.p,{children:["You can validate ",(0,o.jsx)(r.code,{children:"terraform_command"})," in GitHub Actions Workflows."]}),"\n",(0,o.jsx)(r.p,{children:"e.g."}),"\n",(0,o.jsx)(r.pre,{children:(0,o.jsx)(r.code,{className:"language-yaml",children:'- uses: suzuki-shunsuke/tfaction/get-target-config@v1.2.0\n  id: target-config\n\n- run: |\n    echo "::error:: terraform_command is invalid"\n    exit 1\n  if: |\n    ! contains(fromJSON(\'["terraform", "terragrunt", "tofu"]\'), steps.target-config.outputs.terraform_command)\n'})})]})}function u(e={}){const{wrapper:r}={...(0,n.R)(),...e.components};return r?(0,o.jsx)(r,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},8453:(e,r,t)=>{t.d(r,{R:()=>i,x:()=>s});var o=t(6540);const n={},a=o.createContext(n);function i(e){const r=o.useContext(a);return o.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function s(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),o.createElement(a.Provider,{value:r},e.children)}}}]);