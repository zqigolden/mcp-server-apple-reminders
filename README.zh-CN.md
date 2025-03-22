# Apple Reminders MCP Server ![](https://img.shields.io/badge/A%20FRAD%20PRODUCT-WIP-yellow)

[![Twitter Follow](https://img.shields.io/twitter/follow/FradSer?style=social)](https://twitter.com/FradSer)

[English](README.md) | 简体中文

一个为 macOS 提供原生 Apple Reminders 集成的 Model Context Protocol (MCP) 服务器。该服务器允许你通过标准化接口与 Apple Reminders 进行交互。

## 功能特性

- 列出所有提醒事项和提醒事项列表
- 创建带有标题和可选详细信息的新提醒事项
- 将提醒事项标记为完成/未完成
- 为提醒事项添加备注
- 为提醒事项设置截止日期
- 原生 macOS 集成

## 系统要求

- Node.js 18 或更高版本
- macOS（Apple Reminders 集成所需）
- Xcode Command Line Tools（编译 Swift 代码所需）

## 快速开始

通过 npm 全局安装：

```bash
npm install -g mcp-server-apple-reminders
```

## 配置说明

### 配置 Cursor

1. 打开 Cursor
2. 打开 Cursor 设置
3. 点击侧边栏中的 "MCP"
4. 点击 "Add new global MCP server"
5. 使用以下设置配置服务器：
    ```json
    {
      "mcpServers": {
        "apple-reminders": {
          "command": "mcp-server-apple-reminders",
          "args": []
        }
      }
    }
    ```

### 配置 ChatWise

1. 打开 ChatWise
2. 进入设置
3. 导航至工具部分
4. 点击 "+" 按钮
5. 使用以下设置配置工具：
   - 类型：`stdio`
   - ID：`apple-reminders`
   - 命令：`mcp-server-apple-reminders`
   - 参数：（留空）

### 配置 Claude Desktop

你需要配置 Claude Desktop 以识别 Apple Reminders MCP 服务器。有两种方式可以访问配置：

#### 方式 1：通过 Claude Desktop 界面

1. 打开 Claude Desktop 应用
2. 从左上角菜单栏启用开发者模式
3. 打开设置并导航至开发者选项
4. 点击编辑配置按钮打开 `claude_desktop_config.json`

#### 方式 2：直接访问文件

macOS：
```bash
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Windows：
```bash
code %APPDATA%\Claude\claude_desktop_config.json
```

### 2. 添加服务器配置

将以下配置添加到你的 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "apple-reminders": {
      "command": "mcp-server-apple-reminders",
      "args": []
    }
  }
}
```

### 3. 重启 Claude Desktop

要使更改生效：

1. 完全退出 Claude Desktop（不仅仅是关闭窗口）
2. 重新启动 Claude Desktop
3. 查看工具图标以验证 Apple Reminders 服务器是否已连接

## 使用示例

配置完成后，你可以让 Claude 与你的 Apple Reminders 进行交互。以下是一些示例提示：

### 创建提醒事项
```
创建一个明天下午 5 点的"买杂货"提醒。
添加一个"打电话给妈妈"的提醒，备注"询问周末计划"。
在"工作"列表中创建一个下周五到期的"提交报告"提醒。
```

### 管理提醒事项
```
显示我的所有提醒事项。
列出"购物"列表中的所有提醒事项。
显示我已完成的提醒事项。
```

### 处理列表
```
显示所有提醒事项列表。
显示"工作"列表中的提醒事项。
```

服务器将：
- 处理你的自然语言请求
- 与 Apple 原生提醒事项应用交互
- 向 Claude 返回格式化结果
- 维护与 macOS 的原生集成

## 可用的 MCP 工具

此服务器提供以下 MCP 服务用于与 Apple Reminders 交互：

### 创建提醒事项

`create_reminder(title: string, dueDate?: string, list?: string, note?: string)`

创建具有指定标题和可选参数的新提醒事项：
- `title`：提醒事项标题（必需）
- `dueDate`：可选的截止日期，格式为 'YYYY-MM-DD HH:mm:ss'（例如：'2025-03-12 10:00:00'）
- `list`：可选的提醒事项列表名称
- `note`：可选的备注文本

示例响应：
```json
{
  "content": [
    {
      "type": "text",
      "text": "Successfully created reminder: Buy groceries with notes"
    }
  ],
  "isError": false
}
```

### 列出提醒事项

`list_reminders(list?: string, showCompleted?: boolean)`

列出所有提醒事项或特定列表中的提醒事项：
- `list`：可选的提醒事项列表名称
- `showCompleted`：是否显示已完成的提醒事项（默认：false）

示例响应：
```json
{
  "reminders": [
    {
      "title": "Buy groceries",
      "list": "Shopping",
      "isCompleted": false,
      "dueDate": "2024-03-25 18:00:00",
      "notes": "Don't forget milk"
    }
  ],
  "total": 1,
  "filter": {
    "list": "Shopping",
    "showCompleted": false
  }
}
```

### 列出提醒事项列表

`list_reminder_lists()`

返回所有可用提醒事项列表。

示例响应：
```json
{
  "lists": [
    {
      "id": 1,
      "title": "Shopping"
    },
    {
      "id": 2,
      "title": "Work"
    }
  ],
  "total": 2
}
```

## 开发

1. 安装依赖：
```bash
npm install
```

2. 构建用于 Apple Reminders 集成的 Swift 二进制文件：
```bash
npm run build:swift
```

3. 构建 TypeScript 代码：
```bash
npm run build:ts
```

### 项目结构

```
.
├── src/                   # 源代码目录
│   ├── index.ts           # 主入口点
│   ├── server/            # MCP 服务器实现
│   ├── swift/             # 原生 Swift 集成代码
│   │   ├── bin/           # 编译后的 Swift 二进制文件
│   │   └── src/           # Swift 源文件
│   ├── tools/             # CLI 工具和实用程序
│   ├── types/             # TypeScript 类型定义
│   └── utils/             # 辅助函数和实用工具
├── dist/                  # 编译后的 JavaScript 输出
├── node_modules/          # Node.js 依赖
└── tests/                 # 测试文件和测试实用程序
```

### 可用脚本

- `npm run build:ts` - 构建 TypeScript 代码
- `npm run build:swift` - 构建 Swift 二进制文件
- `npm run dev` - 在监视模式下运行 TypeScript 编译器
- `npm run start` - 启动 MCP 服务器
- `npm test` - 运行测试

## License

MIT

## Contributing

Contributions welcome! Please read the contributing guidelines first.
