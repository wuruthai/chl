export default {
  name: "flare",
  icon: "burn",
  children: [
    {
      name: "Cluster",
      icon: "superscript",
      children: [
        {
          name: "AgglomerativeCluster",
          icon: "briefcase-medical",
          children: [
            {
              name: "AgglomerativeCluster",
              icon: "briefcase-medical"
            },
            {
              name: "CommunityStructure",
              icon: "pager"
            },
            {
              name: "HierarchicalCluster",
              icon: "sitemap"
            },
            {
              name: "MergeEdge",
              icon: "object-ungroup"
            }
          ]
        },
        {
          name: "CommunityStructure",
          icon: "pager"
        },
        {
          name: "HierarchicalCluster",
          icon: "sitemap"
        },
        {
          name: "MergeEdge",
          icon: "object-ungroup"
        }
      ]
    }
  ]
}