"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[4759],{3905:function(e,t,r){r.d(t,{Zo:function(){return u},kt:function(){return m}});var n=r(7294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var s=n.createContext({}),l=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},u=function(e){var t=l(e.components);return n.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},f=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,s=e.parentName,u=c(e,["components","mdxType","originalType","parentName"]),f=l(r),m=o,d=f["".concat(s,".").concat(m)]||f[m]||p[m]||a;return r?n.createElement(d,i(i({ref:t},u),{},{components:r})):n.createElement(d,i({ref:t},u))}));function m(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,i=new Array(a);i[0]=f;var c={};for(var s in t)hasOwnProperty.call(t,s)&&(c[s]=t[s]);c.originalType=e,c.mdxType="string"==typeof e?e:o,i[1]=c;for(var l=2;l<a;l++)i[l]=r[l];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}f.displayName="MDXCreateElement"},7528:function(e,t,r){r.r(t),r.d(t,{frontMatter:function(){return c},contentTitle:function(){return s},metadata:function(){return l},toc:function(){return u},default:function(){return f}});var n=r(7462),o=r(3366),a=(r(7294),r(3905)),i=["components"],c={sidebar_position:600},s="Validate Terraform Plan Result with Conftest",l={unversionedId:"feature/conftest",id:"feature/conftest",title:"Validate Terraform Plan Result with Conftest",description:"About Conftest, please see https://www.conftest.dev/ .",source:"@site/docs/feature/conftest.md",sourceDirName:"feature",slug:"/feature/conftest",permalink:"/tfaction/docs/feature/conftest",editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/conftest.md",tags:[],version:"current",sidebarPosition:600,frontMatter:{sidebar_position:600},sidebar:"tutorialSidebar",previous:{title:"Manage Terraform Modules",permalink:"/tfaction/docs/feature/module"},next:{title:"Support skipping `terraform plan` and `terraform apply` in case of pull request by Renovate",permalink:"/tfaction/docs/feature/support-skipping-terraform-renovate-pr"}},u=[],p={toc:u};function f(e){var t=e.components,r=(0,o.Z)(e,i);return(0,a.kt)("wrapper",(0,n.Z)({},p,r,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"validate-terraform-plan-result-with-conftest"},"Validate Terraform Plan Result with Conftest"),(0,a.kt)("p",null,"About Conftest, please see ",(0,a.kt)("a",{parentName:"p",href:"https://www.conftest.dev/"},"https://www.conftest.dev/")," ."),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://www.openpolicyagent.org/docs/latest/terraform/"},"https://www.openpolicyagent.org/docs/latest/terraform/")),(0,a.kt)("p",null,"tfaction supports validating Terraform Plan Result with Conftest."),(0,a.kt)("p",null,"If Terraform Plan Result violate your Conftest Policy, the violation is notified as Pull Request Comment."),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150035710-249c4cbd-47fa-46d7-ae0d-28ab4ace1a64.png",alt:"image"})),(0,a.kt)("p",null,"tfaction doesn't provide any Conftest Policy. Please write your Conftest Policy freely."),(0,a.kt)("p",null,"We recommend writing the document about Conftest Policy per policy."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"github-comment.yaml\npolicy/\n  github_issue_label_description.rego # Policy\n  github_issue_label_description_test.rego # Policy Test\n  github_issue_label_description.md # Policy Document\n")),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150035773-1702fba7-5058-412f-b41c-f69793237dd7.png",alt:"image"})))}f.isMDXComponent=!0}}]);