import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

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
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: Tools,
  }));
  return server;
};
