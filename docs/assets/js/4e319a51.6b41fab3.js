"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[698],{9157:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>a,default:()=>l,frontMatter:()=>i,metadata:()=>o,toc:()=>u});const o=JSON.parse('{"id":"feature/generate-config-out","title":"Generate code by terraform plan -generate-config-out","description":"#1860 #1870 v1.7.0","source":"@site/docs/feature/generate-config-out.md","sourceDirName":"feature","slug":"/feature/generate-config-out","permalink":"/tfaction/docs/feature/generate-config-out","draft":false,"unlisted":false,"editUrl":"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/generate-config-out.md","tags":[],"version":"current","sidebarPosition":1130,"frontMatter":{"sidebar_position":1130},"sidebar":"tutorialSidebar","previous":{"title":"Run CI on working directories that depend on a updated local path Module","permalink":"/tfaction/docs/feature/local-path-module"},"next":{"title":"Generate document using terraform-docs","permalink":"/tfaction/docs/feature/terraform-docs"}}');var r=n(4848),s=n(8453);const i={sidebar_position:1130},a="Generate code by terraform plan -generate-config-out",c={},u=[{value:"How to use",id:"how-to-use",level:2}];function d(e){const t={a:"a",admonition:"admonition",code:"code",h1:"h1",h2:"h2",header:"header",li:"li",ol:"ol",p:"p",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.header,{children:(0,r.jsxs)(t.h1,{id:"generate-code-by-terraform-plan--generate-config-out",children:["Generate code by ",(0,r.jsx)(t.code,{children:"terraform plan -generate-config-out"})]})}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/issues/1860",children:"#1860"})," ",(0,r.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/pulls/1870",children:"#1870"})," ",(0,r.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/releases/tag/v1.7.0",children:"v1.7.0"})]}),"\n",(0,r.jsxs)(t.p,{children:[(0,r.jsx)(t.code,{children:"import block"})," and ",(0,r.jsx)(t.code,{children:"terraform plan -generate-config-out"})," are very useful to import resources."]}),"\n",(0,r.jsx)(t.p,{children:(0,r.jsx)(t.a,{href:"https://developer.hashicorp.com/terraform/language/import",children:"https://developer.hashicorp.com/terraform/language/import"})}),"\n",(0,r.jsxs)(t.p,{children:["But some users can't run ",(0,r.jsx)(t.code,{children:"terraform plan"})," on their laptop, so they can't run it."]}),"\n",(0,r.jsxs)(t.p,{children:["tfaction provides an action generating Terraform code by ",(0,r.jsx)(t.code,{children:"terraform plan -generate-config-out"}),"."]}),"\n",(0,r.jsx)(t.h2,{id:"how-to-use",children:"How to use"}),"\n",(0,r.jsxs)(t.p,{children:["Please see ",(0,r.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/generate-config-out.yaml",children:"the example workflow"}),"."]}),"\n",(0,r.jsxs)(t.ol,{children:["\n",(0,r.jsx)(t.li,{children:"Write import blocks and create a feature branch"}),"\n"]}),"\n",(0,r.jsxs)(t.admonition,{type:"info",children:[(0,r.jsx)(t.p,{children:"We considered creating import blocks and pull requests by workflow, but unfortunately it was difficult because input types of workflow_dispatch event don't support multiline text."}),(0,r.jsx)(t.p,{children:(0,r.jsx)(t.a,{href:"https://github.com/orgs/community/discussions/12882",children:"https://github.com/orgs/community/discussions/12882"})}),(0,r.jsx)(t.p,{children:"So we gave up it and decided to have users add import blocks and create a feature branch themselves."})]}),"\n",(0,r.jsxs)(t.ol,{start:"2",children:["\n",(0,r.jsx)(t.li,{children:"Run the workflow by workflow_dispatch event"}),"\n"]}),"\n",(0,r.jsxs)(t.p,{children:["The workflow generate code by ",(0,r.jsx)(t.code,{children:"terraform plan -generate-config-out"})," and pushes a commit to the feature branch."]})]})}function l(e={}){const{wrapper:t}={...(0,s.R)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>i,x:()=>a});var o=n(6540);const r={},s=o.createContext(r);function i(e){const t=o.useContext(s);return o.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function a(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:i(e.components),o.createElement(s.Provider,{value:t},e.children)}}}]);