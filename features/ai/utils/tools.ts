import { gateway } from "ai";

type ExaWeb = Parameters<typeof gateway.tools.exaSearch>[0];


const  exaWebTool : ExaWeb = {
    type: 'fast',
    numResults: 5,
    category: 'news',
    includeDomains: ['reuters.com', 'bbc.com', 'nytimes.com'],
    contents: {
      highlights: true,
      maxAgeHours: 24,
    },
  }

  export default exaWebTool;