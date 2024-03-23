"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[424],{4100:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>a,contentTitle:()=>c,default:()=>f,frontMatter:()=>i,metadata:()=>s,toc:()=>d});var o=n(4848),r=n(8453);const i={sidebar_position:600},c="Validate Terraform Providers using tfprovidercheck",s={id:"config/tfprovidercheck",title:"Validate Terraform Providers using tfprovidercheck",description:"This is not a feature of tfaction, but we describe how to use tfprovidercheck with tfaction.",source:"@site/docs/config/tfprovidercheck.md",sourceDirName:"config",slug:"/config/tfprovidercheck",permalink:"/tfaction/docs/config/tfprovidercheck",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/config/tfprovidercheck.md",tags:[],version:"current",sidebarPosition:600,frontMatter:{sidebar_position:600},sidebar:"tutorialSidebar",previous:{title:"Set Terraform CLI options with the environment variable",permalink:"/tfaction/docs/config/terraform-cli-options"},next:{title:"Prevent workflows from being tampered using pull_request_target",permalink:"/tfaction/docs/config/pull_request_target"}},a={},d=[];function u(e){const t={a:"a",code:"code",h1:"h1",p:"p",pre:"pre",...(0,r.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.h1,{id:"validate-terraform-providers-using-tfprovidercheck",children:"Validate Terraform Providers using tfprovidercheck"}),"\n",(0,o.jsxs)(t.p,{children:["This is not a feature of tfaction, but we describe how to use ",(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfprovidercheck",children:"tfprovidercheck"})," with tfaction."]}),"\n",(0,o.jsx)(t.p,{children:"tfprovidercheck is a command line tool to execute Terraform security. It prevents malicious Terraform Providers from being executed. You can define the allow list of Terraform Providers and their versions, and check if disallowed providers aren't used."}),"\n",(0,o.jsxs)(t.p,{children:["To use tfprovidercheck with tfaction, you need to run ",(0,o.jsx)(t.code,{children:"get-target-config"})," action and tfprovidercheck between ",(0,o.jsx)(t.code,{children:"setup"})," action and ",(0,o.jsx)(t.code,{children:"test"})," action."]}),"\n",(0,o.jsx)(t.p,{children:"e.g."}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/836e7ce5decb3e8c3c368e3f534da3cc3343e858/.github/workflows/wc-test.yaml#L121-L145",children:"https://github.com/suzuki-shunsuke/tfaction-example/blob/836e7ce5decb3e8c3c368e3f534da3cc3343e858/.github/workflows/wc-test.yaml#L121-L145"})}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:"language-yaml",children:'- uses: suzuki-shunsuke/tfaction/setup@26effa08b92b77b5cfe04e2a25c15845fd00b04f # v0.7.2\n  with:\n    github_app_token: ${{steps.token.outputs.token}}\n\n- uses: suzuki-shunsuke/tfaction/get-target-config@26effa08b92b77b5cfe04e2a25c15845fd00b04f # v0.7.2\n  id: target-config\n\n- run: |\n    set -euo pipefail\n    github-comment exec -var "tfaction_target:$TFACTION_TARGET" -- tfprovidercheck -v\n    github-comment exec -var "tfaction_target:$TFACTION_TARGET" -- terraform version -json | github-comment exec -- tfprovidercheck\n  working-directory: ${{ steps.target-config.outputs.working_directory }}\n  env:\n    TFPROVIDERCHECK_CONFIG_BODY: |\n      providers:\n        - name: registry.terraform.io/hashicorp/google\n        - name: registry.terraform.io/hashicorp/aws\n        - name: registry.terraform.io/hashicorp/null\n        - name: registry.terraform.io/integrations/github\n    GITHUB_TOKEN: ${{steps.token.outputs.token}} # For github-comment\n\n- uses: suzuki-shunsuke/tfaction/test@26effa08b92b77b5cfe04e2a25c15845fd00b04f # v0.7.2\n  with:\n    github_app_token: ${{steps.token.outputs.token}}\n'})}),"\n",(0,o.jsx)(t.p,{children:"github-comment.yaml"}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:"language-yaml",children:'hide:\n  default: |\n    Comment.HasMeta && Comment.Meta.SHA1 != Commit.SHA1 && ! (Comment.Meta.Program == "tfcmt" && Comment.Meta.Command == "apply")\nexec:\n  default:\n  - when: ExitCode != 0\n    template: |\n      ## :x: Failed {{if .Vars.tfaction_target}}({{.Vars.tfaction_target}}){{end}}\n\n      {{template "link" .}}\n\n      {{template "join_command" .}}\n\n      {{template "hidden_combined_output" .}}\n'})})]})}function f(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(u,{...e})}):u(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>c,x:()=>s});var o=n(6540);const r={},i=o.createContext(r);function c(e){const t=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function s(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:c(e.components),o.createElement(i.Provider,{value:t},e.children)}}}]);