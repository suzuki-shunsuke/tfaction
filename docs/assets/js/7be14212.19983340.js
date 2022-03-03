"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[1933],{3905:function(t,e,n){n.d(e,{Zo:function(){return l},kt:function(){return m}});var r=n(7294);function i(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function a(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function o(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?a(Object(n),!0).forEach((function(e){i(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function u(t,e){if(null==t)return{};var n,r,i=function(t,e){if(null==t)return{};var n,r,i={},a=Object.keys(t);for(r=0;r<a.length;r++)n=a[r],e.indexOf(n)>=0||(i[n]=t[n]);return i}(t,e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);for(r=0;r<a.length;r++)n=a[r],e.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(t,n)&&(i[n]=t[n])}return i}var c=r.createContext({}),s=function(t){var e=r.useContext(c),n=e;return t&&(n="function"==typeof t?t(e):o(o({},e),t)),n},l=function(t){var e=s(t.components);return r.createElement(c.Provider,{value:e},t.children)},p={inlineCode:"code",wrapper:function(t){var e=t.children;return r.createElement(r.Fragment,{},e)}},f=r.forwardRef((function(t,e){var n=t.components,i=t.mdxType,a=t.originalType,c=t.parentName,l=u(t,["components","mdxType","originalType","parentName"]),f=s(n),m=i,d=f["".concat(c,".").concat(m)]||f[m]||p[m]||a;return n?r.createElement(d,o(o({ref:e},l),{},{components:n})):r.createElement(d,o({ref:e},l))}));function m(t,e){var n=arguments,i=e&&e.mdxType;if("string"==typeof t||i){var a=n.length,o=new Array(a);o[0]=f;var u={};for(var c in e)hasOwnProperty.call(e,c)&&(u[c]=e[c]);u.originalType=t,u.mdxType="string"==typeof t?t:i,o[1]=u;for(var s=2;s<a;s++)o[s]=n[s];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}f.displayName="MDXCreateElement"},4592:function(t,e,n){n.r(e),n.d(e,{frontMatter:function(){return u},contentTitle:function(){return c},metadata:function(){return s},toc:function(){return l},default:function(){return f}});var r=n(7462),i=n(3366),a=(n(7294),n(3905)),o=["components"],u={sidebar_position:900},c="Linters",s={unversionedId:"feature/linter",id:"feature/linter",title:"Linters",description:"tfaction runs some linters in test Action.",source:"@site/docs/feature/linter.md",sourceDirName:"feature",slug:"/feature/linter",permalink:"/tfaction/docs/feature/linter",editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/linter.md",tags:[],version:"current",sidebarPosition:900,frontMatter:{sidebar_position:900},sidebar:"tutorialSidebar",previous:{title:"Auto Fix .terraform.lock.hcl and Terraform Configuration",permalink:"/tfaction/docs/feature/auto-fix"},next:{title:"Support skipping creating pull requests",permalink:"/tfaction/docs/feature/skip-creating-pr"}},l=[{value:"tflint",id:"tflint",children:[],level:2},{value:"tfsec",id:"tfsec",children:[],level:2}],p={toc:l};function f(t){var e=t.components,n=(0,i.Z)(t,o);return(0,a.kt)("wrapper",(0,r.Z)({},p,n,{components:e,mdxType:"MDXLayout"}),(0,a.kt)("h1",{id:"linters"},"Linters"),(0,a.kt)("p",null,"tfaction runs some linters in ",(0,a.kt)("a",{parentName:"p",href:"/actions/test"},"test")," Action.\nIf you don't want to run these linters, please stop using ",(0,a.kt)("a",{parentName:"p",href:"/actions/test"},"test")," Action."),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},"terraform validate"),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/github-action-tflint"},"suzuki-shunsuke/github-action-tflint")),(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"https://github.com/suzuki-shunsuke/github-action-tfsec"},"suzuki-shunsuke/github-action-tfsec"))),(0,a.kt)("h2",{id:"tflint"},"tflint"),(0,a.kt)("p",null,"tfaction runs ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/terraform-linters/tflint"},"tflint")," and notifies the result."),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/153742908-2512f73a-1505-4c0c-9284-b6deb8983c2f.png",alt:"image"})),(0,a.kt)("p",null,"--"),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/153742833-403ea6c5-a780-4d2a-a30c-3a481c0971b1.png",alt:"image"})),(0,a.kt)("h2",{id:"tfsec"},"tfsec"),(0,a.kt)("p",null,"tfaction runs ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/aquasecurity/tfsec"},"tfsec")," and notifies the result."),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/153747798-0e6ac3d4-e335-4c20-8e2a-1f5b43205ff3.png",alt:"image"})),(0,a.kt)("p",null,"--"),(0,a.kt)("p",null,(0,a.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/153747838-ccbd4fba-6654-4589-84c8-7ae833644426.png",alt:"mage"})))}f.isMDXComponent=!0}}]);