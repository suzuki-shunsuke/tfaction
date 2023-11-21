"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[1372],{3905:(e,t,a)=>{a.d(t,{Zo:()=>s,kt:()=>k});var r=a(7294);function n(e,t,a){return t in e?Object.defineProperty(e,t,{value:a,enumerable:!0,configurable:!0,writable:!0}):e[t]=a,e}function i(e,t){var a=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),a.push.apply(a,r)}return a}function l(e){for(var t=1;t<arguments.length;t++){var a=null!=arguments[t]?arguments[t]:{};t%2?i(Object(a),!0).forEach((function(t){n(e,t,a[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(a)):i(Object(a)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(a,t))}))}return e}function o(e,t){if(null==e)return{};var a,r,n=function(e,t){if(null==e)return{};var a,r,n={},i=Object.keys(e);for(r=0;r<i.length;r++)a=i[r],t.indexOf(a)>=0||(n[a]=e[a]);return n}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)a=i[r],t.indexOf(a)>=0||Object.prototype.propertyIsEnumerable.call(e,a)&&(n[a]=e[a])}return n}var u=r.createContext({}),p=function(e){var t=r.useContext(u),a=t;return e&&(a="function"==typeof e?e(t):l(l({},t),e)),a},s=function(e){var t=p(e.components);return r.createElement(u.Provider,{value:t},e.children)},c="mdxType",m={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},f=r.forwardRef((function(e,t){var a=e.components,n=e.mdxType,i=e.originalType,u=e.parentName,s=o(e,["components","mdxType","originalType","parentName"]),c=p(a),f=n,k=c["".concat(u,".").concat(f)]||c[f]||m[f]||i;return a?r.createElement(k,l(l({ref:t},s),{},{components:a})):r.createElement(k,l({ref:t},s))}));function k(e,t){var a=arguments,n=t&&t.mdxType;if("string"==typeof e||n){var i=a.length,l=new Array(i);l[0]=f;var o={};for(var u in t)hasOwnProperty.call(t,u)&&(o[u]=t[u]);o.originalType=e,o[c]="string"==typeof e?e:n,l[1]=o;for(var p=2;p<i;p++)l[p]=a[p];return r.createElement.apply(null,l)}return r.createElement.apply(null,a)}f.displayName="MDXCreateElement"},6777:(e,t,a)=>{a.r(t),a.d(t,{assets:()=>u,contentTitle:()=>l,default:()=>m,frontMatter:()=>i,metadata:()=>o,toc:()=>p});var r=a(7462),n=(a(7294),a(3905));const i={sidebar_position:100,slug:"/"},l="tfaction",o={unversionedId:"overview",id:"overview",title:"tfaction",description:"Who uses tfaction? | Release Note | MIT LICENSE",source:"@site/docs/overview.md",sourceDirName:".",slug:"/",permalink:"/tfaction/docs/",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/overview.md",tags:[],version:"current",sidebarPosition:100,frontMatter:{sidebar_position:100,slug:"/"},sidebar:"tutorialSidebar",next:{title:"Getting Started",permalink:"/tfaction/docs/getting-started"}},u={},p=[{value:"Features",id:"features",level:2},{value:"Who uses tfaction?",id:"who-uses-tfaction",level:2},{value:"Blog, Slide",id:"blog-slide",level:2},{value:"Release Notes",id:"release-notes",level:2},{value:"Versioning Policy",id:"versioning-policy",level:2},{value:"LICENSE",id:"license",level:2}],s={toc:p},c="wrapper";function m(e){let{components:t,...a}=e;return(0,n.kt)(c,(0,r.Z)({},s,a,{components:t,mdxType:"MDXLayout"}),(0,n.kt)("h1",{id:"tfaction"},"tfaction"),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"#who-uses-tfaction"},"Who uses tfaction?")," | ",(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/releases"},"Release Note")," | ",(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/LICENSE"},"MIT LICENSE")),(0,n.kt)("p",null,"tfaction is a framework for a Monorepo to build high-level Terraform workflows using GitHub Actions.\nYou don't have to run ",(0,n.kt)("inlineCode",{parentName:"p"},"terraform apply")," in your laptop, and don't have to reinvent the wheel for Terraform Workflows anymore."),(0,n.kt)("h2",{id:"features"},"Features"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},"Run ",(0,n.kt)("inlineCode",{parentName:"li"},"terraform plan")," in pull requests, and run ",(0,n.kt)("inlineCode",{parentName:"li"},"terraform apply")," by merging pull requests into the default branch"),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/build-matrix"},"Dynamic build matrix for Monorepo"),(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"CI is run on only changed working directories"))),(0,n.kt)("li",{parentName:"ul"},"Notify the results of CI to pull requests using tfcmt, github-comment, and reviewdog",(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"You don't have to check CI log"))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/plan-file"},"Run ",(0,n.kt)("inlineCode",{parentName:"a"},"terraform apply")," safely using the plan file created by the merged pull request's ",(0,n.kt)("inlineCode",{parentName:"a"},"terraform plan"))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/auto-update-related-prs"},"Update related pull requests automatically when the remote state is updated"),(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"Keep the result of CI including ",(0,n.kt)("inlineCode",{parentName:"li"},"terraform plan")," up-to-date"))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/follow-up-pr"},"Create a pull request automatically to follow up the apply failure")),(0,n.kt)("li",{parentName:"ul"},"Support linters",(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"terraform validate"),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://github.com/aquasecurity/tfsec"},"tfsec")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://github.com/aquasecurity/trivy"},"trivy")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://github.com/terraform-linters/tflint"},"tflint")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://www.conftest.dev/"},"conftest")))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/tfmigrate"},"Support tfmigrate")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/renovate"},"Update dependencies by Renovate safely"),(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"Prevent Renovate from applying unexpected changes, and enables to merge pull requests without changes safely"))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/module"},"Workflows for Terraform Modules"),(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"Scaffold, Test, Release Modules"))),(0,n.kt)("li",{parentName:"ul"},"Workflows for scaffolding",(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"Scaffold a working directory, Terraform Module, pull request for tfmigrate"))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/auto-fix"},"Update .terraform.lock.hcl automatically"),(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"A commit is pushed automatically, so you don't have to update .terraform.lock.hcl manually"))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/auto-fix"},"Format Terraform Configuration automatically"),(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"A commit is pushed automatically, so you don't have to format Terraform configuration manually"))),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"/tfaction/docs/feature/drift-detection"},"Drift Detection"),(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},"Detect the drift periodically and manage the drift as GitHub Issues")))),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/build-matrix"},"Dynamic build matrix for Monorepo")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/151699474-b6cf9927-a0d1-4eb7-85fd-19504432362c.png",alt:"image"})),(0,n.kt)("p",null,"Notify the result of CI to pull requests with ",(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfcmt"},"tfcmt"),", ",(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/github-comment"},"github-comment"),", and ",(0,n.kt)("a",{parentName:"p",href:"https://github.com/reviewdog/reviewdog"},"reviewdog")),(0,n.kt)("p",null,"Result of ",(0,n.kt)("inlineCode",{parentName:"p"},"terraform plan")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/147400233-8b9411d6-0255-4c36-9e9f-35e44223c979.png",alt:"image"})),(0,n.kt)("p",null,"Result of ",(0,n.kt)("inlineCode",{parentName:"p"},"tfsec")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/153747798-0e6ac3d4-e335-4c20-8e2a-1f5b43205ff3.png",alt:"image"})),(0,n.kt)("p",null,"Result of ",(0,n.kt)("inlineCode",{parentName:"p"},"trivy")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://github.com/suzuki-shunsuke/trivy-config-action/assets/13323303/e4d7f6f7-3df3-44bb-8f98-535173ce096e",alt:"image"})),(0,n.kt)("p",null,"Result of ",(0,n.kt)("inlineCode",{parentName:"p"},"tflint")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/153742833-403ea6c5-a780-4d2a-a30c-3a481c0971b1.png",alt:"image"})),(0,n.kt)("p",null,"Result of ",(0,n.kt)("inlineCode",{parentName:"p"},"conftest")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150035710-249c4cbd-47fa-46d7-ae0d-28ab4ace1a64.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/auto-update-related-prs"},"Update related pull requests automatically when the remote state is updated")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/151699327-ba31892c-c4a6-47e7-a944-15fca81dfbfb.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/follow-up-pr"},"Create a pull request automatically to follow up the apply failure")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/151699230-1c109a57-47d1-4c3b-9c3a-4dfec786a043.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/151699142-6d19cd51-eac5-4f69-bfe5-7920df69edc6.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/tfmigrate"},"Support tfmigrate")),(0,n.kt)("p",null,(0,n.kt)("inlineCode",{parentName:"p"},"tfmigrate plan")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150029520-fd3aac78-d76a-41ee-9df0-a7fc02fb12b7.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("inlineCode",{parentName:"p"},"tfmigrate apply")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150029697-316218e0-cb1e-4a8d-ad5c-0c12e1cb68dc.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/renovate"},"Update dependencies by Renovate safely")),(0,n.kt)("p",null,"CI fails if there are changes, which enables you to merge pull requests without unexpected changes safely."),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/150064670-2c6a646f-81f2-496f-b69a-873b6469593e.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/auto-fix"},"Update .terraform.lock.hcl automatically")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/155866735-85f964d8-7bb7-411c-9b20-5f7abcea3e1a.png",alt:"image"})),(0,n.kt)("p",null,"--"),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/155866753-32012a3b-02fe-4f58-935e-178283ae2c77.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/auto-fix"},"Format Terraform Configuration")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/155866979-52dd2e6f-9885-4af1-bac0-abd1280fdea5.png",alt:"image"})),(0,n.kt)("p",null,"--"),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/155866989-8cbcd50e-4764-4f47-a50f-102d04a04f89.png",alt:"image"})),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"/tfaction/docs/feature/drift-detection"},"Drift Detection")),(0,n.kt)("p",null,(0,n.kt)("img",{parentName:"p",src:"https://user-images.githubusercontent.com/13323303/233079963-68765f2e-1efd-4278-b6c3-145eae9ef9c0.png",alt:"image"})),(0,n.kt)("h2",{id:"who-uses-tfaction"},"Who uses tfaction?"),(0,n.kt)("admonition",{type:"info"},(0,n.kt)("p",{parentName:"admonition"},"If you want to add your company or organization to the list, please send a pull request!\n",(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/discussions/1280"},"Reference"))),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://topotal.com/"},"Topotal Inc"))),(0,n.kt)("h2",{id:"blog-slide"},"Blog, Slide"),(0,n.kt)("ul",null,(0,n.kt)("li",{parentName:"ul"},"English",(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://dev.to/suzukishunsuke/terraforms-drift-detection-by-tfaction-1dkh"},"2023-06-05 Terraform's Drift Detection by tfaction")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://speakerdeck.com/szksh/tfaction-build-terraform-workflow-with-github-actions"},"2022-02-12 tfaction - Build Terraform Workflow with GitHub Actions")))),(0,n.kt)("li",{parentName:"ul"},"Japanese",(0,n.kt)("ul",{parentName:"li"},(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://zenn.dev/shunsuke_suzuki/articles/tfaction-drift-detection"},"2023-06-05 tfaction \u306b\u3088\u308b Terraform \u306e Drift Detection")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://zenn.dev/shunsuke_suzuki/articles/tfaction-v050"},"2022-03-03 tfaction v0.5.0 \u306e update")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://zenn.dev/shunsuke_suzuki/articles/tfaction-setup"},"2022-02-06 tfaction \u306e\u5c0e\u5165\u30ac\u30a4\u30c9")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://blog.studysapuri.jp/entry/2022/02/04/080000"},"2022-02-04 Terraform \u306e CI \u3092 AWS CodeBuild \u304b\u3089 GitHub Actions + tfaction \u306b\u79fb\u884c\u3057\u307e\u3057\u305f")),(0,n.kt)("li",{parentName:"ul"},(0,n.kt)("a",{parentName:"li",href:"https://zenn.dev/shunsuke_suzuki/articles/tfaction-introduction"},"2022-01-24 tfaction - GitHub Actions \u3067\u826f\u3044\u611f\u3058\u306e Terraform Workflow \u3092\u69cb\u7bc9"))))),(0,n.kt)("h2",{id:"release-notes"},"Release Notes"),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/releases"},"https://github.com/suzuki-shunsuke/tfaction/releases")),(0,n.kt)("h2",{id:"versioning-policy"},"Versioning Policy"),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/versioning-policy/blob/v0.1.0/POLICY.md"},"suzuki-shunsuke/versioning-policy v0.1.0"),", which is compatible with ",(0,n.kt)("a",{parentName:"p",href:"https://semver.org/"},"Semantic Versioning 2.0.0"),"."),(0,n.kt)("h2",{id:"license"},"LICENSE"),(0,n.kt)("p",null,(0,n.kt)("a",{parentName:"p",href:"https://github.com/suzuki-shunsuke/tfaction/blob/main/LICENSE"},"MIT")))}m.isMDXComponent=!0}}]);