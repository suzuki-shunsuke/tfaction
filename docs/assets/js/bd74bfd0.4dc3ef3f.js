"use strict";(self.webpackChunktfaction=self.webpackChunktfaction||[]).push([[36],{5788:(e,t,r)=>{r.d(t,{Iu:()=>c,yg:()=>y});var n=r(1504);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var s=n.createContext({}),p=function(e){var t=n.useContext(s),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},c=function(e){var t=p(e.components);return n.createElement(s.Provider,{value:t},e.children)},f="mdxType",u={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,s=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),f=p(r),d=a,y=f["".concat(s,".").concat(d)]||f[d]||u[d]||i;return r?n.createElement(y,o(o({ref:t},c),{},{components:r})):n.createElement(y,o({ref:t},c))}));function y(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,o=new Array(i);o[0]=d;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l[f]="string"==typeof e?e:a,o[1]=l;for(var p=2;p<i;p++)o[p]=r[p];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},1820:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>s,contentTitle:()=>o,default:()=>u,frontMatter:()=>i,metadata:()=>l,toc:()=>p});var n=r(5072),a=(r(1504),r(5788));const i={sidebar_position:80},o="Apply safely with Terraform Plan File",l={unversionedId:"feature/plan-file",id:"feature/plan-file",title:"Apply safely with Terraform Plan File",description:"Apply safely with Terraform Plan file created by Pull Request.",source:"@site/docs/feature/plan-file.md",sourceDirName:"feature",slug:"/feature/plan-file",permalink:"/tfaction/docs/feature/plan-file",draft:!1,editUrl:"https://github.com/suzuki-shunsuke/tfaction-docs/edit/main/docs/feature/plan-file.md",tags:[],version:"current",sidebarPosition:80,frontMatter:{sidebar_position:80},sidebar:"tutorialSidebar",previous:{title:"Notify the result of terraform plan and apply with tfcmt",permalink:"/tfaction/docs/feature/tfcmt"},next:{title:"Automatically update related pull requests when the remote state is updated",permalink:"/tfaction/docs/feature/auto-update-related-prs"}},s={},p=[{value:"tfaction v0.7.0 migrated plan files to GitHub Actions&#39; Artifacts",id:"tfaction-v070-migrated-plan-files-to-github-actions-artifacts",level:2}],c={toc:p},f="wrapper";function u(e){let{components:t,...r}=e;return(0,a.yg)(f,(0,n.c)({},c,r,{components:t,mdxType:"MDXLayout"}),(0,a.yg)("h1",{id:"apply-safely-with-terraform-plan-file"},"Apply safely with Terraform Plan File"),(0,a.yg)("p",null,"Apply safely with Terraform Plan file created by Pull Request."),(0,a.yg)("p",null,"tfaction's Workflow"),(0,a.yg)("ol",null,(0,a.yg)("li",{parentName:"ol"},(0,a.yg)("inlineCode",{parentName:"li"},"terraform plan")," is run in the Pull Request CI"),(0,a.yg)("li",{parentName:"ol"},"you check the plan result"),(0,a.yg)("li",{parentName:"ol"},"apply the result by merging the pull request")),(0,a.yg)("p",null,"In this case, it is important to apply the same result as the result of ",(0,a.yg)("inlineCode",{parentName:"p"},"terraform plan")," of the pull request CI.\nOtherwise, unexpected changes may be applied."),(0,a.yg)("p",null,"tfaction stores the latest Terraform Plan files to GitHub Actions' Artifacts per pull request and working directory, and downloading them when ",(0,a.yg)("inlineCode",{parentName:"p"},"terraform apply")," is run."),(0,a.yg)("h2",{id:"tfaction-v070-migrated-plan-files-to-github-actions-artifacts"},"tfaction v0.7.0 migrated plan files to GitHub Actions' Artifacts"),(0,a.yg)("p",null,"tfaction ever stored plan files to S3 or GCS, but tfaction v0.7.0 migrated them to ",(0,a.yg)("a",{parentName:"p",href:"https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts"},"GitHub Actions Artifacts"),".\nBy this change you don't have to create and manage S3 or GCS.\nFurthermore, S3 or GCS had security risks that plan files could be tampered.\nGitHub Actions Artifacts can be uploaded files only in the associated workflow run and can't be tampered from outside of the workflow run."),(0,a.yg)("p",null,"GitHub Actions Artifacts has the retention period so plan files are removed after the retension period.\nThe default retention period is 90 days, and we think it is enough."))}u.isMDXComponent=!0}}]);