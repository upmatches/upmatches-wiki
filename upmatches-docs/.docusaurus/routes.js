import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '3d7'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '9ec'),
    routes: [
      {
        path: '/docs',
        component: ComponentCreator('/docs', '0fb'),
        routes: [
          {
            path: '/docs',
            component: ComponentCreator('/docs', '06f'),
            routes: [
              {
                path: '/docs/algorithms/skill-adjustment',
                component: ComponentCreator('/docs/algorithms/skill-adjustment', 'ca3'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/algorithms/withdrawal-penalty',
                component: ComponentCreator('/docs/algorithms/withdrawal-penalty', 'eb6'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/api/overview',
                component: ComponentCreator('/docs/api/overview', 'e02'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/changelog',
                component: ComponentCreator('/docs/changelog', '74a'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/activity',
                component: ComponentCreator('/docs/modules/activity', 'cc8'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/authentication',
                component: ComponentCreator('/docs/modules/authentication', '4ad'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/game',
                component: ComponentCreator('/docs/modules/game', '699'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/health',
                component: ComponentCreator('/docs/modules/health', 'd3e'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/new-user-onboarding',
                component: ComponentCreator('/docs/modules/new-user-onboarding', '531'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/notification',
                component: ComponentCreator('/docs/modules/notification', 'db0'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/share-link',
                component: ComponentCreator('/docs/modules/share-link', '274'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/skill-levels',
                component: ComponentCreator('/docs/modules/skill-levels', '41c'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/modules/venue',
                component: ComponentCreator('/docs/modules/venue', '3cf'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/rules/game-rules',
                component: ComponentCreator('/docs/rules/game-rules', '065'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/setup/backend',
                component: ComponentCreator('/docs/setup/backend', 'cfa'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/sports/badminton/skill-levels',
                component: ComponentCreator('/docs/sports/badminton/skill-levels', 'b42'),
                exact: true,
                sidebar: "docsSidebar"
              },
              {
                path: '/docs/sports/badminton/venues',
                component: ComponentCreator('/docs/sports/badminton/venues', '6d4'),
                exact: true,
                sidebar: "docsSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', 'e5f'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
