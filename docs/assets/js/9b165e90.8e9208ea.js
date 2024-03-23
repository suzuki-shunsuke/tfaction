"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[394],{293:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>c,contentTitle:()=>a,default:()=>d,frontMatter:()=>n,metadata:()=>o,toc:()=>l});var s=r(4848),i=r(8453);const n={sidebar_position:1e3},a="Support skipping creating pull requests",o={id:"feature/skip-creating-pr",title:"Support skipping creating pull requests",description:"#202",source:"@site/docs/feature/skip-creating-pr.md",sourceDirName:"feature",slug:"/feature/skip-creating-pr",permalink:"/tfaction/docs/feature/skip-creating-pr",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/skip-creating-pr.md",tags:[],version:"current",sidebarPosition:1e3,frontMatter:{sidebar_position:1e3},sidebar:"tutorialSidebar",previous:{title:"Linters",permalink:"/tfaction/docs/feature/linter"},next:{title:"Destroy resources",permalink:"/tfaction/docs/feature/destroy"}},c={},l=[{value:"Follow up pull request",id:"follow-up-pull-request",level:2},{value:"Scaffold working directory",id:"scaffold-working-directory",level:2},{value:"Scaffold tfmigrate migration",id:"scaffold-tfmigrate-migration",level:2},{value:"Scaffold Terraform Module",id:"scaffold-terraform-module",level:2}];function u(e){const t={a:"a",code:"code",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.h1,{id:"support-skipping-creating-pull-requests",children:"Support skipping creating pull requests"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/issues/202",children:"#202"})}),"\n",(0,s.jsx)(t.p,{children:"tfaction supports creating some types of pull requests."}),"\n",(0,s.jsxs)(t.ul,{children:["\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/follow-up-pr",children:"Follow up Pull Request"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/scaffold-working-dir",children:"Scaffold working directory Pull Request"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/tfmigrate#scaffold-migration-pull-request",children:"Scaffold tfmigrate migration Pull Request"})}),"\n",(0,s.jsx)(t.li,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/module",children:"Scaffold Terraform Module Pull Request"})}),"\n"]}),"\n",(0,s.jsxs)(t.p,{children:["They are really useful, but these pull requests are created by GitHub App so you can pass ",(0,s.jsx)(t.a,{href:"https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches#require-pull-request-reviews-before-merging",children:"1 approval Required"})," by approving your changes by yourself.\nTo solve the problem, tfaction provides the setting ",(0,s.jsx)(t.code,{children:"skip_create_pr"})," in ",(0,s.jsx)(t.code,{children:"tfaction-root.yaml"}),"."]}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-yaml",children:"skip_create_pr: true # By default, this is false\n"})}),"\n",(0,s.jsxs)(t.p,{children:["If this is true, tfaction creates a feature branch and guides how to create a pull request but doesn't create a pull request.\nPlease see the tfaction's message and create a pull request by ",(0,s.jsx)(t.a,{href:"https://cli.github.com/manual/gh_pr_create",children:"gh pr create"})," command."]}),"\n",(0,s.jsx)(t.h2,{id:"follow-up-pull-request",children:"Follow up pull request"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/follow-up-pr",children:"Follow up Pull Request"})}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155868691-4a70167c-bf27-4e14-93da-99d72dd39649.png",alt:"image"})}),"\n",(0,s.jsx)(t.h2,{id:"scaffold-working-directory",children:"Scaffold working directory"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/scaffold-working-dir",children:"Scaffold working directory Pull Request"})}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155868783-e5131df4-5291-4f94-993d-dfaf46bdc03d.png",alt:"image"})}),"\n",(0,s.jsx)(t.p,{children:"--"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155868807-3e5a590f-13ef-4c90-ad47-d92102b46e00.png",alt:"image"})}),"\n",(0,s.jsx)(t.h2,{id:"scaffold-tfmigrate-migration",children:"Scaffold tfmigrate migration"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/tfmigrate#scaffold-migration-pull-request",children:"Scaffold tfmigrate migration Pull Request"})}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155868841-d473d487-7b86-4d01-99ce-ad2da1bdad72.png",alt:"image"})}),"\n",(0,s.jsx)(t.p,{children:"--"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155868848-98518c6f-227a-430d-917e-bc366ba48048.png",alt:"image"})}),"\n",(0,s.jsx)(t.h2,{id:"scaffold-terraform-module",children:"Scaffold Terraform Module"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.a,{href:"/tfaction/docs/feature/module",children:"Scaffold Terraform Module Pull Request"})}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156073236-2f1a39d4-9e6e-41a2-bf6c-618b408cba58.png",alt:"image"})}),"\n",(0,s.jsx)(t.p,{children:"--"}),"\n",(0,s.jsx)(t.p,{children:(0,s.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156073275-8a72aaa9-ce19-4e02-b780-f42bf1164441.png",alt:"image"})})]})}function d(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(u,{...e})}):u(e)}},8453:(e,t,r)=>{r.d(t,{R:()=>a,x:()=>o});var s=r(6540);const i={},n=s.createContext(i);function a(e){const t=s.useContext(n);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function o(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:a(e.components),s.createElement(n.Provider,{value:t},e.children)}}}]);