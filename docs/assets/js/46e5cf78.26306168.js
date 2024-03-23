"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[349],{9858:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>u,contentTitle:()=>a,default:()=>l,frontMatter:()=>o,metadata:()=>c,toc:()=>s});var n=r(4848),i=r(5680);const o={sidebar_position:800},a="Auto Fix .terraform.lock.hcl and Terraform Configuration",c={id:"feature/auto-fix",title:"Auto Fix .terraform.lock.hcl and Terraform Configuration",description:"* suzuki-shunsuke/github-action-terraform-init",source:"@site/docs/feature/auto-fix.md",sourceDirName:"feature",slug:"/feature/auto-fix",permalink:"/tfaction/docs/feature/auto-fix",draft:!1,unlisted:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/auto-fix.md",tags:[],version:"current",sidebarPosition:800,frontMatter:{sidebar_position:800},sidebar:"tutorialSidebar",previous:{title:"Support skipping terraform plan and terraform apply in case of pull request by Renovate",permalink:"/tfaction/docs/feature/support-skipping-terraform-renovate-pr"},next:{title:"Drift Detection",permalink:"/tfaction/docs/feature/drift-detection"}},u={},s=[{value:"Auto Fix .terraform.lock.hcl",id:"auto-fix-terraformlockhcl",level:2},{value:"Auto Format Terraform Configuration files",id:"auto-format-terraform-configuration-files",level:2}];function f(e){const t={a:"a",h1:"h1",h2:"h2",img:"img",li:"li",p:"p",ul:"ul",...(0,i.RP)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.h1,{id:"auto-fix-terraformlockhcl-and-terraform-configuration",children:"Auto Fix .terraform.lock.hcl and Terraform Configuration"}),"\n",(0,n.jsxs)(t.ul,{children:["\n",(0,n.jsx)(t.li,{children:(0,n.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/github-action-terraform-init",children:"suzuki-shunsuke/github-action-terraform-init"})}),"\n",(0,n.jsx)(t.li,{children:(0,n.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/github-action-terraform-fmt",children:"suzuki-shunsuke/github-action-terraform-fmt"})}),"\n"]}),"\n",(0,n.jsx)(t.h2,{id:"auto-fix-terraformlockhcl",children:"Auto Fix .terraform.lock.hcl"}),"\n",(0,n.jsx)(t.p,{children:".terraform.lock.hcl is created or updated automatically.\nA commit is pushed to the feature branch."}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.a,{href:"https://github.com/suzuki-shunsuke/github-action-terraform-init",children:"suzuki-shunsuke/github-action-terraform-init"})}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155866735-85f964d8-7bb7-411c-9b20-5f7abcea3e1a.png",alt:"image"})}),"\n",(0,n.jsx)(t.p,{children:"--"}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155866753-32012a3b-02fe-4f58-935e-178283ae2c77.png",alt:"image"})}),"\n",(0,n.jsx)(t.h2,{id:"auto-format-terraform-configuration-files",children:"Auto Format Terraform Configuration files"}),"\n",(0,n.jsx)(t.p,{children:"Terraform Configuration files are formatted automatically.\nA commit is pushed to the feature branch."}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155866979-52dd2e6f-9885-4af1-bac0-abd1280fdea5.png",alt:"image"})}),"\n",(0,n.jsx)(t.p,{children:"--"}),"\n",(0,n.jsx)(t.p,{children:(0,n.jsx)(t.img,{src:"https://user-images.githubusercontent.com/13323303/155866989-8cbcd50e-4764-4f47-a50f-102d04a04f89.png",alt:"image"})})]})}function l(e={}){const{wrapper:t}={...(0,i.RP)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(f,{...e})}):f(e)}},5680:(e,t,r)=>{r.d(t,{RP:()=>s});var n=r(6540);function i(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function a(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){i(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,i=function(e,t){if(null==e)return{};var r,n,i={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(i[r]=e[r]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(i[r]=e[r])}return i}var u=n.createContext({}),s=function(e){var t=n.useContext(u),r=t;return e&&(r="function"==typeof e?e(t):a(a({},t),e)),r},f={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},l=n.forwardRef((function(e,t){var r=e.components,i=e.mdxType,o=e.originalType,u=e.parentName,l=c(e,["components","mdxType","originalType","parentName"]),m=s(r),p=i,h=m["".concat(u,".").concat(p)]||m[p]||f[p]||o;return r?n.createElement(h,a(a({ref:t},l),{},{components:r})):n.createElement(h,a({ref:t},l))}));l.displayName="MDXCreateElement"}}]);