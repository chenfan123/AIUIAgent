# MCP 和 Skill

## MCP

Model control protocol - 模型控制协议

Function Call 是本地过程调用，在代码的内存里完成通信和调用。

期望的是 Function call 对接了公司内的知识库系统，所有的团队都可以使用能力，就是服务化 function call。

MCP 协议是一个 CS 架构，即 MCP Client 和 MCP Server 之间的通信协议。

client 通过标准协议发起 tools，或者其他基于 LLM 能力的服务调用

AI Agent: 其实就是结合了 prompt、 function call 和 mcp 协议，让 LLM 可以调用外部系统的能力。

MCP Client 传输协议：

1. 本地传输协议
2. web/http stream

MCP server:

1. tools: tools 调用是由 LLM 决定的
2. resources: 用来做向 LLM 提供使用 tools 所需的资料和知识
3. prompt: server 的能力以及实现由用户决定的

Client 主要做什么？

1. 建立和 mcp server 的连接（调用接口、保活、检查服务状态等）
2. client 被 LLM 支配，LLM 通过 functionCall 调用 client 的标准协议接口，发送到对应的 MCP server
3. 响应 mcp server 的返回 -> 查询状态、挂了 error code
4. 能力协商（每个 mcp client 遵从的协议版本、包括能力，都不一样）

Server 主要做什么？

1. 能力暴露（tools、resources、prompt）
2. 响应 client 的请求
3. 返回标准化的结果

通信层

1. Stdio 本地通信
2. Stream HTTP
3. SSE:现在 sse 已经不是标准传输了
