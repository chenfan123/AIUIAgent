import inquirer from 'inquirer';
import chalk from 'chalk';
import { generateResponse, functionRunner } from './openai';

export async function startTUI() {
  console.log(chalk.blue('欢迎使用UI Agent'));
  let historyMessages: any[] = [];
  while (true) {
    const { question } = await inquirer.prompt([
      {
        type: 'input',
        name: 'question',
        message: chalk.yellow('请输入你的问题'),
      },
    ]);
    if (question.trim().toLowerCase() === 'exit') {
      break;
    }
    historyMessages.push({
      role: 'user',
      content: question,
    });
    const response = await generateResponse(historyMessages);
    let content = '';
    if (response.choices[0].message.tool_calls) {
      const toolCallInfo = response.choices[0].message.tool_calls;
      const result = await functionRunner(toolCallInfo);
      content = result.message;
    }
    // for await (const chunk of response) {
    //   const delta = chunk.choices[0]?.delta?.content ?? '';
    //   if (delta) {
    //     content += delta;
    //     process.stdout.write(delta);
    //   }
    // }
    process.stdout.write('\n');
    historyMessages.push({ role: 'assistant', content });
  }
}
