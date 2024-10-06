"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[330],{2096:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>a,default:()=>u,frontMatter:()=>i,metadata:()=>d,toc:()=>s});var o=t(4848),r=t(8453);const i={sidebar_position:1120},a="Run CI on working directories that depend on a updated local path Module",d={id:"feature/local-path-module",title:"Run CI on working directories that depend on a updated local path Module",description:"tfaction >= v1.3.0 #1528",source:"@site/docs/feature/local-path-module.md",sourceDirName:"feature",slug:"/feature/local-path-module",permalink:"/tfaction/docs/feature/local-path-module",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/local-path-module.md",tags:[],version:"current",sidebarPosition:1120,frontMatter:{sidebar_position:1120},sidebar:"tutorialSidebar",previous:{title:"Use a Terraform compatible tool",permalink:"/tfaction/docs/feature/use-terraform-compatible-tool"},next:{title:"Generate code by terraform plan -generate-config-out",permalink:"/tfaction/docs/feature/generate-config-out"}},c={},s=[];function l(e){const n={a:"a",code:"code",h1:"h1",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,r.R)(),...e.components};return(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)(n.header,{children:(0,o.jsx)(n.h1,{id:"run-ci-on-working-directories-that-depend-on-a-updated-local-path-module",children:"Run CI on working directories that depend on a updated local path Module"})}),"\n",(0,o.jsxs)(n.p,{children:["tfaction >= v1.3.0 ",(0,o.jsx)(n.a,{href:"https://github.com/suzuki-shunsuke/tfaction/pull/1528",children:"#1528"})]}),"\n",(0,o.jsxs)(n.p,{children:["By default, tfaction runs CI on only working directories where any code is updated.\nThis means even if a working directory depends on a ",(0,o.jsx)(n.a,{href:"https://developer.hashicorp.com/terraform/language/modules/sources#local-paths",children:"local path Module"})," out of the working directory and the module is updated, CI isn't run on the working directory."]}),"\n",(0,o.jsx)(n.p,{children:"e.g."}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:"A working directory A depends on local path Module B"}),"\n",(0,o.jsx)(n.li,{children:"Module B is located out of the working directory A"}),"\n",(0,o.jsx)(n.li,{children:"In a pull request C, working directory A isn't changed but the module B is changed"}),"\n",(0,o.jsx)(n.li,{children:"Then CI isn't run on the working directory A by default"}),"\n"]}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{children:"working directory A/\nmodules/\n  module B\n"})}),"\n",(0,o.jsx)(n.p,{children:"To run CI on the working directory A too, please update tfaction-root.yaml as the following."}),"\n",(0,o.jsx)(n.p,{children:"tfaction-root.yaml"}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-yaml",children:"update_local_path_module_caller:\n  enabled: true\n"})}),"\n",(0,o.jsxs)(n.p,{children:["This feature depends on ",(0,o.jsx)(n.a,{href:"https://github.com/hashicorp/terraform-config-inspect",children:"terraform-config-inspect"}),", so you have to install it.\nSame with other tools, you can install terraform-config-inspect with ",(0,o.jsx)(n.a,{href:"https://aquaproj.github.io/",children:"aqua"}),"."]}),"\n",(0,o.jsx)(n.p,{children:"e.g."}),"\n",(0,o.jsx)(n.pre,{children:(0,o.jsx)(n.code,{className:"language-yaml",children:"packages:\n  - name: hashicorp/terraform-config-inspect\n    version: a34142ec2a72dd916592afd3247dd354f1cc7e5c\n"})}),"\n",(0,o.jsx)(n.p,{children:"In that case, Go is required."}),"\n",(0,o.jsx)(n.p,{children:"If this feature is enabled, when a module is updated in a pull request, CI is run on working directories depending on the module.\nThe module dependency is checked recursively.\nFor example, in the above case if the module B depends on a module C and module C is updated in a pull request,\nCI is run on the working directory A even if the working directory A and the module B aren't updated."})]})}function u(e={}){const{wrapper:n}={...(0,r.R)(),...e.components};return n?(0,o.jsx)(n,{...e,children:(0,o.jsx)(l,{...e})}):l(e)}},8453:(e,n,t)=>{t.d(n,{R:()=>a,x:()=>d});var o=t(6540);const r={},i=o.createContext(r);function a(e){const n=o.useContext(i);return o.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function d(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:a(e.components),o.createElement(i.Provider,{value:n},e.children)}}}]);