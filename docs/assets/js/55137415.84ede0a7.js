"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[412],{3905:(e,t,a)=>{a.d(t,{Zo:()=>p,kt:()=>f});var n=a(7294);function o(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function r(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,n)}return a}function l(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?r(Object(a),!0).forEach((function(t){o(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):r(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function u(e,t){if(null==e)return{};var a,n,o=function(e,t){if(null==e)return{};var a,n,o={},r=Object.keys(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||(o[a]=e[a]);return o}(e,t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);for(n=0;n<r.length;n++)a=r[n],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(o[a]=e[a])}return o}var i=n.createContext({}),s=function(e){var t=n.useContext(i),a=t;return e&&(a="function"==typeof e?e(t):l(l({},t),e)),a},p=function(e){var t=s(e.components);return n.createElement(i.Provider,{value:t},e.children)},m="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var a=e.components,o=e.mdxType,r=e.originalType,i=e.parentName,p=u(e,["components","mdxType","originalType","parentName"]),m=s(a),d=o,f=m["".concat(i,".").concat(d)]||m[d]||c[d]||r;return a?n.createElement(f,l(l({ref:t},p),{},{components:a})):n.createElement(f,l({ref:t},p))}));function f(e,t){var a=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var r=a.length,l=new Array(r);l[0]=d;var u={};for(var i in t)hasOwnProperty.call(t,i)&&(u[i]=t[i]);u.originalType=e,u[m]="string"==typeof e?e:o,l[1]=u;for(var s=2;s<r;s++)l[s]=a[s];return n.createElement.apply(null,l)}return n.createElement.apply(null,a)}d.displayName="MDXCreateElement"},5583:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>i,contentTitle:()=>l,default:()=>c,frontMatter:()=>r,metadata:()=>u,toc:()=>s});var n=a(7462),o=(a(7294),a(3905));const r={sidebar_position:450},l="Manage Terraform Modules",u={unversionedId:"feature/module",id:"feature/module",title:"Manage Terraform Modules",description:"tfaction's required version: >= v0.5.0 #221",source:"@site/docs/feature/module.md",sourceDirName:"feature",slug:"/feature/module",permalink:"/tfaction/docs/feature/module",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/module.md",tags:[],version:"current",sidebarPosition:450,frontMatter:{sidebar_position:450},sidebar:"tutorialSidebar",previous:{title:"tfmigrate",permalink:"/tfaction/docs/feature/tfmigrate"},next:{title:"Validate Terraform Plan Result with Conftest",permalink:"/tfaction/docs/feature/conftest"}},i={},s=[{value:"Scaffold Module",id:"scaffold-module",level:2},{value:"Test Module",id:"test-module",level:2},{value:"Generate Document",id:"generate-document",level:3},{value:"Release Module",id:"release-module",level:2},{value:"\ud83d\udca1 Trouble shooting about downloading Private Modules",id:"-trouble-shooting-about-downloading-private-modules",level:2}],p={toc:s},m="wrapper";function c(e){let{components:t,...a}=e;return(0,o.kt)(m,(0,n.Z)({},p,a,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"manage-terraform-modules"},"Manage Terraform Modules"),(0,o.kt)("p",null,(0,o.kt)("em",{parentName:"p"},"tfaction's required version: ",(0,o.kt)("inlineCode",{parentName:"em"},">= v0.5.0")," ",(0,o.kt)("a",{parentName:"em",href:"https://github.com/suzuki-shunsuke/tfaction/issues/221"},"#221"))),(0,o.kt)("p",null,"tfaction supports scaffolding, testing, and releasing Terraform Modules."),(0,o.kt)("p",null,"Please add a file ",(0,o.kt)("inlineCode",{parentName:"p"},"tfaction_module.yaml")," in the Module directory.\ntfaction detects Modules with this file.\nCurrently, tfaction doesn't read the content, so there is no problem even if the content is empty."),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-yaml"},"{}\n")),(0,o.kt)("h2",{id:"scaffold-module"},"Scaffold Module"),(0,o.kt)("p",null,"\ud83d\udca1 If you don't want to create pull requests by GitHub App, please see ",(0,o.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/skip-creating-pr"},"Support skipping creating pull requests"),"."),(0,o.kt)("p",null,"You can scaffold a new Terraform Module by GitHub Actions."),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Prepare templates of Terraform Modules")),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction-example/tree/example-v1-2/templates/module-hello"},"example")),(0,o.kt)("ol",{start:2},(0,o.kt)("li",{parentName:"ol"},"Set up the workflow")),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/scaffold-module.yaml"},"example")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/scaffold-module/action.yaml"},"action"))),(0,o.kt)("ol",{start:3},(0,o.kt)("li",{parentName:"ol"},"Execute the workflow")),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/156072535-e9d65c62-23b8-48a1-9827-f9fce4ea191c.png",alt:"image"})),(0,o.kt)("p",null,"--"),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/156072431-56345976-60ba-4874-afcd-37026ec0510a.png",alt:"image"})),(0,o.kt)("h2",{id:"test-module"},"Test Module"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/wc-test-module.yaml"},"example")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/test-module/action.yaml"},"action"))),(0,o.kt)("h3",{id:"generate-document"},"Generate Document"),(0,o.kt)("p",null,"The action ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/test-module/action.yaml"},"test-module")," generates the document by ",(0,o.kt)("a",{parentName:"p",href:"https://github.com/terraform-docs/terraform-docs"},"terraform-docs"),"."),(0,o.kt)("p",null,"If ",(0,o.kt)("inlineCode",{parentName:"p"},"README.md")," is generated or updated, a commit is pushed to the feature branch ",(0,o.kt)("inlineCode",{parentName:"p"},"$GITHUB_HEAD_REF"),"."),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/156068791-96406162-e42c-4197-aa9c-40bd457af941.png",alt:"image"})),(0,o.kt)("p",null,"--"),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/156068986-5df71e03-c662-4735-aae8-5acf061d595b.png",alt:"image"})),(0,o.kt)("h2",{id:"release-module"},"Release Module"),(0,o.kt)("p",null,"Instead of ",(0,o.kt)("a",{parentName:"p",href:"https://www.terraform.io/language/modules/sources#local-paths"},"Local paths")," Source, we recommend creating a tag and fix the version by ",(0,o.kt)("a",{parentName:"p",href:"https://www.terraform.io/language/modules/sources#github"},"GitHub")," Source."),(0,o.kt)("ol",null,(0,o.kt)("li",{parentName:"ol"},"Set up the workflow")),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction-example/blob/main/.github/workflows/release-module.yaml"},"Example workflow")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/release-module/action.yaml"},"action"))),(0,o.kt)("ol",{start:2},(0,o.kt)("li",{parentName:"ol"},"Release a new version by executing the workflow")),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/156072006-12d48ac2-95ee-41ab-a90a-42b232f40140.png",alt:"image"})),(0,o.kt)("p",null,"--"),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/156072085-cabd76cd-e8a4-44af-b407-e862f4bf9946.png",alt:"image"})),(0,o.kt)("ol",{start:3},(0,o.kt)("li",{parentName:"ol"},"Use the Module")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-hcl"},'module "foo" {\n  source = "github.com/${GitHub Repository full name}//${module path}?ref=${GitHub tag name}"\n}\n')),(0,o.kt)("h2",{id:"-trouble-shooting-about-downloading-private-modules"},"\ud83d\udca1 Trouble shooting about downloading Private Modules"),(0,o.kt)("p",null,"If it fails to download Private Modules in ",(0,o.kt)("inlineCode",{parentName:"p"},"terraform init"),", you may have to run ",(0,o.kt)("a",{parentName:"p",href:"https://cli.github.com/manual/gh_auth_setup-git"},"gh auth setup-git")," with GitHub Access Token."),(0,o.kt)("p",null,"Error of ",(0,o.kt)("inlineCode",{parentName:"p"},"terraform init")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre"},"Upgrading modules...\nDownloading git::https://github.com/***/***.git?ref=*** for ***...\n\u2577\n\u2502 Error: Failed to download module\n\u2502 \n\u2502 Could not download module \"***\" (main.tf:1) source code\n\u2502 from\n\u2502 \"git::https://github.com/***/***.git?ref=***\":\n\u2502 error downloading\n\u2502 'https://github.com/***/***.git?ref=***':\n\u2502 /usr/bin/git exited with 128: Cloning into\n\u2502 '.terraform/modules/***'...\n\u2502 fatal: could not read Username for 'https://github.com': No such device or\n\u2502 address\n\u2502 \n\u2575\n")),(0,o.kt)("p",null,"GitHub Actions Workflow"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-yaml"},"# This is required to download private modules in `terraform init`\n- run: gh auth setup-git\n  env:\n    GITHUB_TOKEN: ${{ steps.generate_token.outputs.token }}\n\n- uses: suzuki-shunsuke/tfaction/setup@v0.5.0\n  with:\n    github_app_token: ${{ steps.generate_token.outputs.token }}\n")))}c.isMDXComponent=!0}}]);