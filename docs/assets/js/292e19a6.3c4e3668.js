"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[140],{6350:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>u,contentTitle:()=>i,default:()=>d,frontMatter:()=>o,metadata:()=>c,toc:()=>l});var s=r(4848),n=r(8453);const o={sidebar_position:700},i="Prevent workflows from being tampered using pull_request_target",c={id:"config/pull_request_target",title:"Prevent workflows from being tampered using pull_request_target",description:"Terraform Workflows requires strong permissions to manage resources, so it's important to prevent workflows from being tampered in terms of security.",source:"@site/docs/config/pull_request_target.md",sourceDirName:"config",slug:"/config/pull_request_target",permalink:"/tfaction/docs/config/pull_request_target",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/config/pull_request_target.md",tags:[],version:"current",sidebarPosition:700,frontMatter:{sidebar_position:700},sidebar:"tutorialSidebar",previous:{title:"Validate Terraform Providers using tfprovidercheck",permalink:"/tfaction/docs/config/tfprovidercheck"}},u={},l=[];function a(e){const t={a:"a",code:"code",h1:"h1",li:"li",ol:"ol",p:"p",...(0,n.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsxs)(t.h1,{id:"prevent-workflows-from-being-tampered-using-pull_request_target",children:["Prevent workflows from being tampered using ",(0,s.jsx)(t.code,{children:"pull_request_target"})]}),"\n",(0,s.jsxs)(t.p,{children:["Terraform Workflows requires strong permissions to manage resources, so it's important to prevent workflows from being tampered in terms of security.\nSo we recommend using ",(0,s.jsx)(t.code,{children:"pull_request_target"})," event instead of ",(0,s.jsx)(t.code,{children:"pull_request"})," event.\nFor the detail, please see the blog post."]}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.a,{href:"https://dev.to/suzukishunsuke/secure-github-actions-by-pullrequesttarget-641",children:"Secure GitHub Actions by pull_request_target | dev.to"})}),"\n",(0,s.jsxs)(t.p,{children:["To use ",(0,s.jsx)(t.code,{children:"pull_request_target"}),", you need to fix workflow files."]}),"\n",(0,s.jsxs)(t.ol,{children:["\n",(0,s.jsxs)(t.li,{children:["Fix ",(0,s.jsx)(t.code,{children:"actions/checkout"}),"'s ",(0,s.jsx)(t.code,{children:"ref"})]}),"\n",(0,s.jsxs)(t.li,{children:["Set the merge commit hash to the environment variables ",(0,s.jsx)(t.code,{children:"GH_COMMENT_SHA1"})," and ",(0,s.jsx)(t.code,{children:"TFCMT_SHA"})," for github-comment and tfcmt"]}),"\n",(0,s.jsx)(t.li,{children:"Fix OIDC settings"}),"\n",(0,s.jsx)(t.li,{children:"Stop executing feature branches' scripts and actions"}),"\n"]}),"\n",(0,s.jsxs)(t.p,{children:["Please see the above blog post and ",(0,s.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example",children:"tfaction-example"}),"."]}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example/pull/2056",children:"ci: use pull_request_target | suzuki-shunsuke/tfaction-example#2056"})})]})}function d(e={}){const{wrapper:t}={...(0,n.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(a,{...e})}):a(e)}},8453:(e,t,r)=>{r.d(t,{R:()=>i,x:()=>c});var s=r(6540);const n={},o=s.createContext(n);function i(e){const t=s.useContext(o);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:i(e.components),s.createElement(o.Provider,{value:t},e.children)}}}]);