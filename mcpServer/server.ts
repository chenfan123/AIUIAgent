import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const Tools = [
  {
    name: 'generate-mock',
    description:
      '一个生成MOCK数据的工具，根据接口对应的IDL以及业务知识生成可用的JSON格式mock数据',
    inputSchema: {},
  },
];

export const createServer = () => {
  const server = new Server(
    {
      name: 'mock-genernate0server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  // 处理 ListToolsRequestSchema 请求，返回工具列表
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Tools,
  }));

  const transport = new StdioServerTransport();

  server.connect(transport);
  console.error('MCP server running on stdio');
  return server;
};
