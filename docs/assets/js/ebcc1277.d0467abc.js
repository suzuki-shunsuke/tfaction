"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[4707],{3905:(t,e,a)=>{a.d(e,{Zo:()=>p,kt:()=>k});var n=a(7294);function r(t,e,a){return e in t?Object.defineProperty(t,e,{value:a,enumerable:!0,configurable:!0,writable:!0}):t[e]=a,t}function i(t,e){var a=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),a.push.apply(a,n)}return a}function o(t){for(var e=1;e<arguments.length;e++){var a=null!=arguments[e]?arguments[e]:{};e%2?i(Object(a),!0).forEach((function(e){r(t,e,a[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(a)):i(Object(a)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(a,e))}))}return t}function l(t,e){if(null==t)return{};var a,n,r=function(t,e){if(null==t)return{};var a,n,r={},i=Object.keys(t);for(n=0;n<i.length;n++)a=i[n],e.indexOf(a)>=0||(r[a]=t[a]);return r}(t,e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(t);for(n=0;n<i.length;n++)a=i[n],e.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(t,a)&&(r[a]=t[a])}return r}var c=n.createContext({}),s=function(t){var e=n.useContext(c),a=e;return t&&(a="function"==typeof t?t(e):o(o({},e),t)),a},p=function(t){var e=s(t.components);return n.createElement(c.Provider,{value:e},t.children)},u="mdxType",f={inlineCode:"code",wrapper:function(t){var e=t.children;return n.createElement(n.Fragment,{},e)}},m=n.forwardRef((function(t,e){var a=t.components,r=t.mdxType,i=t.originalType,c=t.parentName,p=l(t,["components","mdxType","originalType","parentName"]),u=s(a),m=r,k=u["".concat(c,".").concat(m)]||u[m]||f[m]||i;return a?n.createElement(k,o(o({ref:e},p),{},{components:a})):n.createElement(k,o({ref:e},p))}));function k(t,e){var a=arguments,r=e&&e.mdxType;if("string"==typeof t||r){var i=a.length,o=new Array(i);o[0]=m;var l={};for(var c in e)hasOwnProperty.call(e,c)&&(l[c]=e[c]);l.originalType=t,l[u]="string"==typeof t?t:r,o[1]=l;for(var s=2;s<i;s++)o[s]=a[s];return n.createElement.apply(null,o)}return n.createElement.apply(null,a)}m.displayName="MDXCreateElement"},4240:(t,e,a)=>{a.r(e),a.d(e,{assets:()=>c,contentTitle:()=>o,default:()=>f,frontMatter:()=>i,metadata:()=>l,toc:()=>s});var n=a(7462),r=(a(7294),a(3905));const i={sidebar_position:200},o="Actions",l={unversionedId:"actions/index",id:"actions/index",title:"Actions",description:"Main Actions",source:"@site/docs/actions/index.md",sourceDirName:"actions",slug:"/actions/",permalink:"/tfaction/docs/actions/",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/actions/index.md",tags:[],version:"current",sidebarPosition:200,frontMatter:{sidebar_position:200},sidebar:"tutorialSidebar",previous:{title:"Set Terraform CLI options with the environment variable",permalink:"/tfaction/docs/config/terraform-cli-options"},next:{title:"check-terraform-skip",permalink:"/tfaction/docs/actions/check-terraform-skip"}},c={},s=[{value:"Main Actions",id:"main-actions",level:2},{value:"Low level Actions",id:"low-level-actions",level:2},{value:"Dependent Actions",id:"dependent-actions",level:2}],p={toc:s},u="wrapper";function f(t){let{components:e,...a}=t;return(0,r.kt)(u,(0,n.Z)({},p,a,{components:e,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"actions"},"Actions"),(0,r.kt)("h2",{id:"main-actions"},"Main Actions"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/list-targets"},"list-targets")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/setup"},"setup")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/export-secrets"},"export-secrets")),(0,r.kt)("li",{parentName:"ul"},"pull request workflow",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/test"},"test")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/tfmigrate-plan"},"tfmigrate-plan")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/terraform-plan"},"terraform-plan")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/test-module"},"test-module")))),(0,r.kt)("li",{parentName:"ul"},"apply workflow",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/tfmigrate-apply"},"tfmigrate-apply")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/terraform-apply"},"terraform-apply")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/create-follow-up-pr"},"create-follow-up-pr")))),(0,r.kt)("li",{parentName:"ul"},"scaffold working directory",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/create-scaffold-pr"},"create-scaffold-pr")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/scaffold-working-dir"},"scaffold-working-dir")))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/scaffold-tfmigrate"},"scaffold-tfmigrate")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/scaffold-module"},"scaffold-module")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/release-module"},"release-module"))),(0,r.kt)("h2",{id:"low-level-actions"},"Low level Actions"),(0,r.kt)("p",null,"These Actions are used in Main Actions internally."),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/get-target-config"},"get-target-config")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/get-global-config"},"get-global-config")),(0,r.kt)("li",{parentName:"ul"},"list-targets",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/list-targets-with-changed-files"},"list-targets-with-changed-files")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/list-working-dirs"},"list-working-dirs")))),(0,r.kt)("li",{parentName:"ul"},"setup",(0,r.kt)("ul",{parentName:"li"},(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/deploy-ssh-key"},"deploy-ssh-key")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/export-aws-secrets-manager"},"export-aws-secrets-manager")))),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"/tfaction/docs/actions/check-terraform-skip"},"check-terraform-skip"))),(0,r.kt)("h2",{id:"dependent-actions"},"Dependent Actions"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/github-action-tflint"},"suzuki-shunsuke/github-action-tflint")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/github-action-tfsec"},"suzuki-shunsuke/github-action-tfsec")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/trivy-config-action"},"suzuki-shunsuke/trivy-config-action")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/github-action-terraform-fmt"},"suzuki-shunsuke/github-action-terraform-fmt")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/aws-actions/configure-aws-credentials"},"aws-actions/configure-aws-credentials")),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("a",{parentName:"li",href:"https://github.com/google-github-actions/auth"},"google-github-actions/auth"))))}f.isMDXComponent=!0}}]);