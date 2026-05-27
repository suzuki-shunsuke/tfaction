// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const { themes } = require("prism-react-renderer");
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

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
          editUrl: "https://github.com/suzuki-shunsuke/tfaction/edit/main",
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
        ],
      },
    ],
  ],
};

module.exports = config;
