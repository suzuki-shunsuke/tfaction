"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[294],{1335:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>a,contentTitle:()=>l,default:()=>d,frontMatter:()=>r,metadata:()=>s,toc:()=>c});const s=JSON.parse('{"id":"feature/module","title":"Manage Terraform Modules","description":"tfaction\'s required version: >= v0.5.0 #221","source":"@site/docs/feature/module.md","sourceDirName":"feature","slug":"/feature/module","permalink":"/tfaction/docs/feature/module","draft":false,"unlisted":false,"editUrl":"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/module.md","tags":[],"version":"current","sidebarPosition":450,"frontMatter":{"sidebar_position":450},"sidebar":"tutorialSidebar","previous":{"title":"tfmigrate","permalink":"/tfaction/docs/feature/tfmigrate"},"next":{"title":"Conftest","permalink":"/tfaction/docs/feature/conftest"}}');var o=n(4848),i=n(8453);const r={sidebar_position:450},l="Manage Terraform Modules",a={},c=[{value:"Scaffold Module",id:"scaffold-module",level:2},{value:"Test Module",id:"test-module",level:2},{value:"Generate Document",id:"generate-document",level:3},{value:"Release Module",id:"release-module",level:2},{value:"\ud83d\udca1 Trouble shooting about downloading Private Modules",id:"bulb-trouble-shooting-about-downloading-private-modules",level:2}];function u(e){const t={a:"a",code:"code",em:"em",h1:"h1",h2:"h2",h3:"h3",header:"header",img:"img",li:"li",ol:"ol",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(t.header,{children:(0,o.jsx)(t.h1,{id:"manage-terraform-modules",children:"Manage Terraform Modules"})}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsxs)(t.em,{children:["tfaction's required version: ",(0,o.jsx)(t.code,{children:">= v0.5.0"})," ",(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/issues/221",children:"#221"})]})}),"\n",(0,o.jsx)(t.p,{children:"tfaction supports scaffolding, testing, and releasing Terraform Modules."}),"\n",(0,o.jsxs)(t.p,{children:["Please add a file ",(0,o.jsx)(t.code,{children:"tfaction_module.yaml"})," in the Module directory.\ntfaction detects Modules with this file.\nCurrently, tfaction doesn't read the content, so there is no problem even if the content is empty."]}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:"language-yaml",children:"{}\n"})}),"\n",(0,o.jsx)(t.h2,{id:"scaffold-module",children:"Scaffold Module"}),"\n",(0,o.jsxs)(t.p,{children:["\ud83d\udca1"," If you don't want to create pull requests by GitHub App, please see ",(0,o.jsx)(t.a,{href:"/tfaction/docs/feature/skip-creating-pr",children:"Support skipping creating pull requests"}),"."]}),"\n",(0,o.jsx)(t.p,{children:"You can scaffold a new Terraform Module by GitHub Actions."}),"\n",(0,o.jsxs)(t.ol,{children:["\n",(0,o.jsx)(t.li,{children:"Prepare templates of Terraform Modules"}),"\n"]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example/tree/example-v1-2/templates/module-hello",children:"example"})}),"\n",(0,o.jsxs)(t.ol,{start:"2",children:["\n",(0,o.jsx)(t.li,{children:"Set up the workflow"}),"\n"]}),"\n",(0,o.jsxs)(t.ul,{children:["\n",(0,o.jsx)(t.li,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/scaffold-module.yaml",children:"example"})}),"\n",(0,o.jsx)(t.li,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/scaffold-module/action.yaml",children:"action"})}),"\n"]}),"\n",(0,o.jsxs)(t.ol,{start:"3",children:["\n",(0,o.jsx)(t.li,{children:"Execute the workflow"}),"\n"]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156072535-e9d65c62-23b8-48a1-9827-f9fce4ea191c.png",alt:"image"})}),"\n",(0,o.jsx)(t.p,{children:"--"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156072431-56345976-60ba-4874-afcd-37026ec0510a.png",alt:"image"})}),"\n",(0,o.jsx)(t.h2,{id:"test-module",children:"Test Module"}),"\n",(0,o.jsxs)(t.ul,{children:["\n",(0,o.jsx)(t.li,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/wc-test-module.yaml",children:"example"})}),"\n",(0,o.jsx)(t.li,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/test-module/action.yaml",children:"action"})}),"\n"]}),"\n",(0,o.jsx)(t.h3,{id:"generate-document",children:"Generate Document"}),"\n",(0,o.jsxs)(t.p,{children:["The action ",(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/test-module/action.yaml",children:"test-module"})," generates the document by ",(0,o.jsx)(t.a,{href:"https://github.com/terraform-docs/terraform-docs",children:"terraform-docs"}),"."]}),"\n",(0,o.jsxs)(t.p,{children:["If ",(0,o.jsx)(t.code,{children:"README.md"})," is generated or updated, a commit is pushed to the feature branch ",(0,o.jsx)(t.code,{children:"$GITHUB_HEAD_REF"}),"."]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156068791-96406162-e42c-4197-aa9c-40bd457af941.png",alt:"image"})}),"\n",(0,o.jsx)(t.p,{children:"--"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156068986-5df71e03-c662-4735-aae8-5acf061d595b.png",alt:"image"})}),"\n",(0,o.jsx)(t.h2,{id:"release-module",children:"Release Module"}),"\n",(0,o.jsxs)(t.p,{children:["Instead of ",(0,o.jsx)(t.a,{href:"https://www.terraform.io/language/modules/sources#local-paths",children:"Local paths"})," Source, we recommend creating a tag and fix the version by ",(0,o.jsx)(t.a,{href:"https://www.terraform.io/language/modules/sources#github",children:"GitHub"})," Source."]}),"\n",(0,o.jsxs)(t.ol,{children:["\n",(0,o.jsx)(t.li,{children:"Set up the workflow"}),"\n"]}),"\n",(0,o.jsxs)(t.ul,{children:["\n",(0,o.jsx)(t.li,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/release-module.yaml",children:"Example workflow"})}),"\n",(0,o.jsx)(t.li,{children:(0,o.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/release-module/action.yaml",children:"action"})}),"\n"]}),"\n",(0,o.jsxs)(t.ol,{start:"2",children:["\n",(0,o.jsx)(t.li,{children:"Release a new version by executing the workflow"}),"\n"]}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156072006-12d48ac2-95ee-41ab-a90a-42b232f40140.png",alt:"image"})}),"\n",(0,o.jsx)(t.p,{children:"--"}),"\n",(0,o.jsx)(t.p,{children:(0,o.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/156072085-cabd76cd-e8a4-44af-b407-e862f4bf9946.png",alt:"image"})}),"\n",(0,o.jsxs)(t.ol,{start:"3",children:["\n",(0,o.jsx)(t.li,{children:"Use the Module"}),"\n"]}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:"language-hcl",children:'module "foo" {\n  source = "github.com/${GitHub Repository full name}//${module path}?ref=${GitHub tag name}"\n}\n'})}),"\n",(0,o.jsxs)(t.h2,{id:"bulb-trouble-shooting-about-downloading-private-modules",children:["\ud83d\udca1"," Trouble shooting about downloading Private Modules"]}),"\n",(0,o.jsxs)(t.p,{children:["If it fails to download Private Modules in ",(0,o.jsx)(t.code,{children:"terraform init"}),", you may have to run ",(0,o.jsx)(t.a,{href:"https://cli.github.com/manual/gh_auth_setup-git",children:"gh auth setup-git"})," with GitHub Access Token."]}),"\n",(0,o.jsxs)(t.p,{children:["Error of ",(0,o.jsx)(t.code,{children:"terraform init"})]}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{children:"Upgrading modules...\nDownloading git::https://github.com/***/***.git?ref=*** for ***...\n\u2577\n\u2502 Error: Failed to download module\n\u2502 \n\u2502 Could not download module \"***\" (main.tf:1) source code\n\u2502 from\n\u2502 \"git::https://github.com/***/***.git?ref=***\":\n\u2502 error downloading\n\u2502 'https://github.com/***/***.git?ref=***':\n\u2502 /usr/bin/git exited with 128: Cloning into\n\u2502 '.terraform/modules/***'...\n\u2502 fatal: could not read Username for 'https://github.com': No such device or\n\u2502 address\n\u2502 \n\u2575\n"})}),"\n",(0,o.jsx)(t.p,{children:"GitHub Actions Workflow"}),"\n",(0,o.jsx)(t.pre,{children:(0,o.jsx)(t.code,{className:"language-yaml",children:"# This is required to download private modules in `terraform init`\n- run: gh auth setup-git\n  env:\n    GITHUB_TOKEN: ${{ steps.generate_token.outputs.token }}\n\n- uses: suzuki-shunsuke/tfaction/setup@v0.5.0\n  with:\n    github_app_token: ${{ steps.generate_token.outputs.token }}\n"})})]})}function d(e={}){const{wrapper:t}={...(0,i.R)(),...e.components};return t?(0,o.jsx)(t,{...e,children:(0,o.jsx)(u,{...e})}):u(e)}},8453:(e,t,n)=>{n.d(t,{R:()=>r,x:()=>l});var s=n(6540);const o={},i=s.createContext(o);function r(e){const t=s.useContext(i);return s.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function l(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(o):e.components||o:r(e.components),s.createElement(i.Provider,{value:t},e.children)}}}]);