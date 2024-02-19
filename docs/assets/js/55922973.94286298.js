"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[917],{5680:(e,t,r)=>{r.d(t,{xA:()=>u,yg:()=>f});var a=r(6540);function n(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,a)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){n(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function o(e,t){if(null==e)return{};var r,a,n=function(e,t){if(null==e)return{};var r,a,n={},i=Object.keys(e);for(a=0;a<i.length;a++)r=i[a],t.indexOf(r)>=0||(n[r]=e[r]);return n}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(a=0;a<i.length;a++)r=i[a],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(n[r]=e[r])}return n}var p=a.createContext({}),g=function(e){var t=a.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},u=function(e){var t=g(e.components);return a.createElement(p.Provider,{value:t},e.children)},m="mdxType",s={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},c=a.forwardRef((function(e,t){var r=e.components,n=e.mdxType,i=e.originalType,p=e.parentName,u=o(e,["components","mdxType","originalType","parentName"]),m=g(r),c=n,f=m["".concat(p,".").concat(c)]||m[c]||s[c]||i;return r?a.createElement(f,l(l({ref:t},u),{},{components:r})):a.createElement(f,l({ref:t},u))}));function f(e,t){var r=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var i=r.length,l=new Array(i);l[0]=c;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o[m]="string"==typeof e?e:n,l[1]=o;for(var g=2;g<i;g++)l[g]=r[g];return a.createElement.apply(null,l)}return a.createElement.apply(null,r)}c.displayName="MDXCreateElement"},32:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>p,contentTitle:()=>l,default:()=>s,frontMatter:()=>i,metadata:()=>o,toc:()=>g});var a=r(8168),n=(r(6540),r(5680));const i={sidebar_position:400},l="tfmigrate",o={unversionedId:"feature/tfmigrate",id:"feature/tfmigrate",title:"tfmigrate",description:"About tfmigrate, please see https://github.com/minamijoyo/tfmigrate .",source:"@site/docs/feature/tfmigrate.md",sourceDirName:"feature",slug:"/feature/tfmigrate",permalink:"/tfaction/docs/feature/tfmigrate",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/tfmigrate.md",tags:[],version:"current",sidebarPosition:400,frontMatter:{sidebar_position:400},sidebar:"tutorialSidebar",previous:{title:"Scaffold working directory by GitHub Actions workflow_dispatch event",permalink:"/tfaction/docs/feature/scaffold-working-dir"},next:{title:"Manage Terraform Modules",permalink:"/tfaction/docs/feature/module"}},p={},g=[{value:"multi_state migration",id:"multi_state-migration",level:2},{value:"Scaffold migration pull request",id:"scaffold-migration-pull-request",level:2},{value:"\ud83d\udca1 Skip creating pull requests",id:"-skip-creating-pull-requests",level:3}],u={toc:g},m="wrapper";function s(e){let{components:t,...r}=e;return(0,n.yg)(m,(0,a.A)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,n.yg)("h1",{id:"tfmigrate"},"tfmigrate"),(0,n.yg)("p",null,"About tfmigrate, please see ",(0,n.yg)("a",{parentName:"p",href:"https://github.com/minamijoyo/tfmigrate"},"https://github.com/minamijoyo/tfmigrate")," ."),(0,n.yg)("p",null,"You can introduce tfmigrate to Terraform Workflow easily with tfaction."),(0,n.yg)("ol",null,(0,n.yg)("li",{parentName:"ol"},"Create .tfmigrate.hcl and migration file in the working directory"),(0,n.yg)("li",{parentName:"ol"},"Create a Pull Request with label ",(0,n.yg)("inlineCode",{parentName:"li"},"tfmigrate:<target>"))),(0,n.yg)("p",null,(0,n.yg)("inlineCode",{parentName:"p"},"tfmigrate plan")," is run in the pull request CI, and ",(0,n.yg)("inlineCode",{parentName:"p"},"tfmigrate apply")," is run in the main branch."),(0,n.yg)("p",null,"The label prefix ",(0,n.yg)("inlineCode",{parentName:"p"},"tfmigrate:")," can be changed in the configuration file ",(0,n.yg)("a",{parentName:"p",href:"/config/tfaction-root-yaml"},"tfaction-root.yaml"),"."),(0,n.yg)("pre",null,(0,n.yg)("code",{parentName:"pre",className:"language-yaml"},'label_prefixes:\n  tfmigrate: "migrate:"\n  skip: "skip:"\n')),(0,n.yg)("p",null,(0,n.yg)("inlineCode",{parentName:"p"},"tfmigrate plan")," is run."),(0,n.yg)("p",null,(0,n.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150029520-fd3aac78-d76a-41ee-9df0-a7fc02fb12b7.png",alt:"image"})),(0,n.yg)("p",null,(0,n.yg)("inlineCode",{parentName:"p"},"tfmigrate apply")," is run."),(0,n.yg)("p",null,(0,n.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150029697-316218e0-cb1e-4a8d-ad5c-0c12e1cb68dc.png",alt:"image"})),(0,n.yg)("h2",{id:"multi_state-migration"},"multi_state migration"),(0,n.yg)("p",null,"If you migrate resources from the target ",(0,n.yg)("inlineCode",{parentName:"p"},"A")," to the target ",(0,n.yg)("inlineCode",{parentName:"p"},"B")," using ",(0,n.yg)("a",{parentName:"p",href:"https://github.com/minamijoyo/tfmigrate#multi_state-mv"},"tfmigrate's multi_state"),"."),(0,n.yg)("ol",null,(0,n.yg)("li",{parentName:"ol"},"Create .tfmigrate.hcl and migration file in the working directory ",(0,n.yg)("inlineCode",{parentName:"li"},"A")),(0,n.yg)("li",{parentName:"ol"},"Create a Pull Request with label ",(0,n.yg)("inlineCode",{parentName:"li"},"tfmigrate:<target A>")," and ",(0,n.yg)("inlineCode",{parentName:"li"},"skip:<target B>"))),(0,n.yg)("p",null,"Or"),(0,n.yg)("ol",null,(0,n.yg)("li",{parentName:"ol"},"Create .tfmigrate.hcl and migration file in the working directory ",(0,n.yg)("inlineCode",{parentName:"li"},"B")),(0,n.yg)("li",{parentName:"ol"},"Create a Pull Request with label ",(0,n.yg)("inlineCode",{parentName:"li"},"tfmigrate:<target B>")," and ",(0,n.yg)("inlineCode",{parentName:"li"},"skip:<target A>"))),(0,n.yg)("p",null,"The label ",(0,n.yg)("inlineCode",{parentName:"p"},"skip:<target>")," is important to prevent ",(0,n.yg)("inlineCode",{parentName:"p"},"terraform plan")," and ",(0,n.yg)("inlineCode",{parentName:"p"},"terraform apply")," from being run."),(0,n.yg)("h2",{id:"scaffold-migration-pull-request"},"Scaffold migration pull request"),(0,n.yg)("p",null,"It is a little bothersome to write migration file.\nYou can scaffold migration pull request by GitHub Actions."),(0,n.yg)("p",null,(0,n.yg)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/scaffold-tfmigrate.yaml"},"workflow")),(0,n.yg)("p",null,(0,n.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/154389701-737050cf-beca-4754-9852-76986e4ebf21.png",alt:"image"})),(0,n.yg)("p",null,(0,n.yg)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/154388296-420b421e-1940-446a-a8e1-95d2b4f3f782.png",alt:"image"})),(0,n.yg)("h3",{id:"-skip-creating-pull-requests"},"\ud83d\udca1 Skip creating pull requests"),(0,n.yg)("p",null,"If you don't want to create pull requests by GitHub App, please see ",(0,n.yg)("a",{parentName:"p",href:"/tfaction/docs/feature/skip-creating-pr"},"Support skipping creating pull requests"),"."))}s.isMDXComponent=!0}}]);