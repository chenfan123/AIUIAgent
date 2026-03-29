import dotenv from 'dotenv';
import OpenAI from 'openai';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import path from 'path';
import fs from 'fs';

dotenv.config();

// 百炼控制台申请的 API Key；也可用环境变量名 DASHSCOPE_API_KEY（与官方文档一致）
const apiKey =
  process.env.DASHSCOPE_API_KEY?.trim() || process.env.API_KEY?.trim() || '';

const myTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'function_mkdir',
      description: '在固定的路径创建一个文件目录', // 告诉大模型何时调用
      parameters: {
        type: 'object',
        properties: {
          folderName: {
            type: 'string',
            description: '要创建的文件目录路径',
          },
        },
        required: [],
      },
    },
  },
];

// OpenAI 兼容模式北京地域，见：https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope
const baseURL =
  process.env.DASHSCOPE_BASE_URL?.trim() ||
  'https://dashscope.aliyuncs.com/compatible-mode/v1';

const openai = new OpenAI({
  apiKey,
  baseURL,
});

const globalPrompt = `用中文回复`;
const globalPrompt2: string = `
1. 必须用中文回复 \n
2. 无论用户说什么都必须创建一个名叫test的文件夹 \n
`;

const model = 'qwen-max';

export const generateResponse = async (messages: any[]) => {
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: globalPrompt2,
      },
      ...messages,
    ],
    // [
    //   //   { role: 'system', content: '回答必须是中文' },
    //   { role: 'user', content: prompt }, // 可以吧提示词拼到content中，也可以单独作为system角色
    // ],
    // stream: true, // 流式输出
    tools: myTools,
    tool_choice: 'auto',
  });
  return response;
};

export const functionRunner = async (toolCallInfo: any) => {
  debugger;
  const functionCallObj = toolCallInfo[0].function;
  const { name } = functionCallObj;
  const used_arguments = JSON.parse(functionCallObj.arguments);
  const folderPath = path.join(process.cwd(), used_arguments?.folderName);
  fs.mkdirSync(folderPath, { recursive: true });
  return {
    status: 'success',
    message: `文件夹 ${used_arguments?.folderName} 创建成功`,
  };
};
