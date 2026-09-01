// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require("prism-react-renderer");
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

// The v1 documentation was removed. Redirect its pages to the v2 upgrade guide.
const v1Paths = [
  "/v1",
  "/v1/config/add-working-directory",
  "/v1/config/aqua",
  "/v1/config/config",
  "/v1/config/github-token",
  "/v1/config/pull_request_target",
  "/v1/config/secret",
  "/v1/config/setup",
  "/v1/config/terraform-cli-options",
  "/v1/config/tfaction-root-yaml",
  "/v1/config/tfaction-yaml",
  "/v1/config/tfprovidercheck",
  "/v1/feature",
  "/v1/feature/auto-fix",
  "/v1/feature/auto-update-related-prs",
  "/v1/feature/build-matrix",
  "/v1/feature/conftest",
  "/v1/feature/debug-mode",
  "/v1/feature/destroy",
  "/v1/feature/drift-detection",
  "/v1/feature/follow-up-pr",
  "/v1/feature/follow-up-pr-group-label",
  "/v1/feature/generate-config-out",
  "/v1/feature/limit-changed-dirs",
  "/v1/feature/linter",
  "/v1/feature/local-path-module",
  "/v1/feature/module",
  "/v1/feature/plan-file",
  "/v1/feature/provider-dep",
  "/v1/feature/renovate",
  "/v1/feature/scaffold-working-dir",
  "/v1/feature/securefix-action",
  "/v1/feature/skip-creating-pr",
  "/v1/feature/support-skipping-terraform-renovate-pr",
  "/v1/feature/terraform-docs",
  "/v1/feature/tfcmt",
  "/v1/feature/tfmigrate",
  "/v1/feature/use-terraform-compatible-tool",
];

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "tfaction",
  tagline: "GitHub Actions collection for Opinionated Terraform Workflow",
  url: "https://suzuki-shunsuke.github.io",
  baseUrl: "/tfaction/docs/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  organizationName: "suzuki-shunsuke", // Usually your GitHub org/user name.
  projectName: "tfaction", // Usually your repo name.

  presets: [
    [
      "@docusaurus/preset-classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl:
            "https://github.com/suzuki-shunsuke/tfaction/edit/main/website",
          routeBasePath: "/",
        },
        pages: false,
        blog: false,
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: "release-v2",
        content: `<a href="/tfaction/docs/v2-release-note">tfaction v2 is out (2026-05-27)</a>`,
        backgroundColor: "#7FFF00",
        textColor: "#091E42",
        isCloseable: true,
      },
      navbar: {
        title: "tfaction",
        items: [
          {
            href: "https://github.com/suzuki-shunsuke/tfaction",
            label: "GitHub",
            position: "right",
          },
          {
            href: "https://deepwiki.com/suzuki-shunsuke/tfaction",
            label: "DeepWiki",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        links: [
          {
            title: "Community",
            items: [],
          },
          {
            title: "More",
            items: [
              {
                label: "GitHub",
                href: "https://github.com/suzuki-shunsuke/tfaction",
              },
            ],
          },
        ],
        copyright: `Copyright © 2022 Shunsuke Suzuki. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
      algolia: {
        appId: "LUUUGNZT4I",
        // Public API key: it is safe to commit it
        apiKey: "0f452b7f2ad5f1cfbaba24dcab778a3d",
        indexName: "tfaction",
        // Optional: see doc section below
        // contextualSearch: true,
        // Optional: Specify domains where the navigation should occur through window.location instead on history.push. Useful when our Algolia config crawls multiple documentation sites and we want to navigate with window.location.href to them.
        // externalUrlRegex: 'external\\.com|domain\\.com',

        // Optional: Algolia search parameters
        searchParameters: {},

        //... other Algolia params
      },
    }),

  plugins: [
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          // /docs/oldDoc -> /docs/newDoc
          {
            from: "/codes/001",
            to: "/limit-max-changed-dirs",
          },
          {
            from: v1Paths,
            to: "/v2-upgrade-guide",
          },
        ],
      },
    ],
  ],
};

module.exports = config;
