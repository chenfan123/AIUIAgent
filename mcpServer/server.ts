import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const Tools = [
  {
    name: 'generate-mock',
    description:
      '一个生成MOCK数据的工具，根据接口对应的IDL以及业务知识生成可用的JSON格式mock数据',
    inputSchema: {
      type: 'object',
      properties: {
        apiUrl: {
          type: 'string',
          description: '需要生成mock数据的接口URL路径',
        },
      },
    },
    required: ['apiUrl'],
  },
];

type Endpoint = {
  apiUrl: string;
  method: string;
  response?: { status?: number; body?: unknown };
};

type IdlDoc = {
  version?: string;
  service?: string;
  endpoints?: Endpoint[];
};

let idlCache: { allEndpoints: Endpoint[] } | null = null;

function normalizeApiUrl(input: string): string {
  const raw = (input ?? '').toString().trim();
  if (!raw) return '';

  // 去掉 query / fragment
  const noQuery = raw.split('#')[0].split('?')[0];

  // 允许传入完整 URL：例如 https://host/api/orders
  if (/^https?:\/\//i.test(noQuery)) {
    try {
      return new URL(noQuery).pathname.replace(/\/+$/, '') || '/';
    } catch {
      // ignore
    }
  }

  let p = noQuery;
  if (!p.startsWith('/')) p = '/' + p;
  // 去掉尾斜杠（但保留根路径）
  p = p.replace(/\/+$/, '') || '/';
  return p;
}

async function loadIdlEndpoints(): Promise<{ allEndpoints: Endpoint[] }> {
  if (idlCache) return idlCache;

  // 不依赖 Cursor 启动 MCP 时的 cwd，直接基于 server.ts 所在目录定位
  const serverDir = path.dirname(fileURLToPath(import.meta.url));
  const idlDir = path.join(serverDir, 'idl');
  const [userRaw, orderRaw] = await Promise.all([
    fs.readFile(path.join(idlDir, 'user-api.json'), 'utf8').catch(() => 'null'),
    fs
      .readFile(path.join(idlDir, 'order-api.json'), 'utf8')
      .catch(() => 'null'),
  ]);

  const userDoc = JSON.parse(userRaw || 'null') as IdlDoc | null;
  const orderDoc = JSON.parse(orderRaw || 'null') as IdlDoc | null;

  const allEndpoints: Endpoint[] = [
    ...(userDoc?.endpoints ?? []),
    ...(orderDoc?.endpoints ?? []),
  ];

  idlCache = { allEndpoints };
  return idlCache;
}

function matchTemplatePath(inputPath: string, templatePath: string): boolean {
  // /api/orders/:id -> /^\/api\/orders\/[^/]+$/
  const input = normalizeApiUrl(inputPath);
  const template = normalizeApiUrl(templatePath);

  const escaped = templatePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = '^' + escaped.replace(/:\\w+/g, '[^/]+') + '$';
  return new RegExp(pattern).test(input);
}

export const createServer = () => {
  const server = new Server(
    {
      name: 'mock-generate-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  // 处理 ListToolsRequestSchema 请求，返回工具列表
  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    const usedResponse = Tools;
    /**
     * { method: 'tools/list' } request [
        {
            name: 'generate-mock',
            description: '一个生成MOCK数据的工具，根据接口对应的IDL以及业务知识生成可用的JSON格式mock数据',
            inputSchema: {}
        }
    ] */
    console.error(request, 'request', usedResponse);
    return {
      tools: Tools,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    console.error('[MCP tools/call]', {
      name,
      args,
      rawParams: request.params,
    });
    if (name === 'find_resource') {
    }
    if (name === 'wirte_mock_file') {
    }
    if (name === 'generate-mock') {
      const apiUrl = String((args as any)?.apiUrl ?? '');
      const apiPath = normalizeApiUrl(apiUrl);

      const { allEndpoints } = await loadIdlEndpoints();

      const endpoint =
        allEndpoints.find((e) => matchTemplatePath(apiPath, e.apiUrl)) ??
        allEndpoints.find((e) => normalizeApiUrl(e.apiUrl) === apiPath) ??
        // 有些客户端可能会漏掉 `/api` 前缀，这里做一次兜底尝试
        (apiPath.startsWith('/api/')
          ? undefined
          : allEndpoints.find(
              (e) => normalizeApiUrl(e.apiUrl) === '/api' + apiPath,
            ));

      // 为了调试：找不到时把候选端点列出来（避免你感觉“没命中”）
      if (!endpoint) {
        const candidates = allEndpoints
          .map((e) => normalizeApiUrl(e.apiUrl))
          .filter(Boolean);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  code: 404,
                  message: 'mock not found for apiUrl',
                  apiUrl,
                  normalized: apiPath,
                  candidates,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      const mock = endpoint?.response?.body ?? {
        code: 404,
        message: 'mock not found',
        data: null,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(mock, null, 2),
          },
        ],
        structuredContent: {
          apiUrl,
          mock,
        },
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { code: 400, message: 'unknown tool', data: null },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  });

  const transport = new StdioServerTransport();

  server.connect(transport);
  console.error('MCP server running on stdio');
  return server;
};
