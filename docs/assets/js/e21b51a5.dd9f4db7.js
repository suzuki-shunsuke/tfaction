"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[2426],{3905:(t,e,r)=>{r.d(e,{Zo:()=>f,kt:()=>d});var n=r(7294);function o(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function a(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function i(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?a(Object(r),!0).forEach((function(e){o(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function c(t,e){if(null==t)return{};var r,n,o=function(t,e){if(null==t)return{};var r,n,o={},a=Object.keys(t);for(n=0;n<a.length;n++)r=a[n],e.indexOf(r)>=0||(o[r]=t[r]);return o}(t,e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);for(n=0;n<a.length;n++)r=a[n],e.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(t,r)&&(o[r]=t[r])}return o}var u=n.createContext({}),l=function(t){var e=n.useContext(u),r=e;return t&&(r="function"==typeof t?t(e):i(i({},e),t)),r},f=function(t){var e=l(t.components);return n.createElement(u.Provider,{value:e},t.children)},p="mdxType",s={inlineCode:"code",wrapper:function(t){var e=t.children;return n.createElement(n.Fragment,{},e)}},m=n.forwardRef((function(t,e){var r=t.components,o=t.mdxType,a=t.originalType,u=t.parentName,f=c(t,["components","mdxType","originalType","parentName"]),p=l(r),m=o,d=p["".concat(u,".").concat(m)]||p[m]||s[m]||a;return r?n.createElement(d,i(i({ref:e},f),{},{components:r})):n.createElement(d,i({ref:e},f))}));function d(t,e){var r=arguments,o=e&&e.mdxType;if("string"==typeof t||o){var a=r.length,i=new Array(a);i[0]=m;var c={};for(var u in e)hasOwnProperty.call(e,u)&&(c[u]=e[u]);c.originalType=t,c[p]="string"==typeof t?t:o,i[1]=c;for(var l=2;l<a;l++)i[l]=r[l];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},9662:(t,e,r)=>{r.r(e),r.d(e,{assets:()=>u,contentTitle:()=>i,default:()=>s,frontMatter:()=>a,metadata:()=>c,toc:()=>l});var n=r(7462),o=(r(7294),r(3905));const a={sidebar_position:70},i="Notify the result of terraform plan and apply with tfcmt",c={unversionedId:"feature/tfcmt",id:"feature/tfcmt",title:"Notify the result of terraform plan and apply with tfcmt",description:"image",source:"@site/docs/feature/tfcmt.md",sourceDirName:"feature",slug:"/feature/tfcmt",permalink:"/tfaction/docs/feature/tfcmt",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/tfcmt.md",tags:[],version:"current",sidebarPosition:70,frontMatter:{sidebar_position:70},sidebar:"tutorialSidebar",previous:{title:"Support Monorepo with GitHub Actions build matrix",permalink:"/tfaction/docs/feature/build-matrix"},next:{title:"Apply safely with Terraform Plan File",permalink:"/tfaction/docs/feature/plan-file"}},u={},l=[],f={toc:l},p="wrapper";function s(t){let{components:e,...r}=t;return(0,o.kt)(p,(0,n.Z)({},f,r,{components:e,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"notify-the-result-of-terraform-plan-and-apply-with-tfcmt"},"Notify the result of terraform plan and apply with tfcmt"),(0,o.kt)("p",null,(0,o.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/147400233-8b9411d6-0255-4c36-9e9f-35e44223c979.png",alt:"image"})),(0,o.kt)("p",null,"tfaction notifies the result of terraform plan and apply with tfcmt."),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/tfcmt"},"https://github.com/suzuki-shunsuke/tfcmt")),(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"https://dev.to/suzukishunsuke/tfcmt-improve-terraform-workflow-with-pr-comment-and-label-1kh7"},"https://dev.to/suzukishunsuke/tfcmt-improve-terraform-workflow-with-pr-comment-and-label-1kh7"))))}s.isMDXComponent=!0}}]);