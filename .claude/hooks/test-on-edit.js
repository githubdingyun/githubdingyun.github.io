#!/usr/bin/env node
/**
 * PostToolUse hook：代码写完后自动跑测试（教学示例）
 *
 * 触发时机：Edit / Write / NotebookEdit 之后（代码已写入磁盘）
 * 逻辑：
 *   1. 只关心「代码文件」（按后缀过滤，非代码文件直接放行）
 *   2. 解析要跑的测试命令（环境变量 > 配置文件 > 自动探测）
 *   3. 跑测试：
 *      - 通过   → 注入一条「✅ 测试通过」上下文，继续
 *      - 失败/超时 → 以 exit 2 打断，把失败输出回传给模型去修
 *
 * 测试命令解析优先级：
 *   1) 环境变量 TEST_ON_EDIT_COMMAND
 *   2) 项目根目录 .claude/test-command（第一行）
 *   3) 自动探测：pom.xml→mvn test、package.json→npm test、pyproject.toml→pytest …
 *
 * 实用提示：若觉得「每次编辑都跑全套测试」太慢/太吵，可把触发点改成 Stop hook
 * （任务收尾时统一跑一次），或在这里加「同文件去抖」逻辑。
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 哪些后缀算「代码文件」（可自行增删）
const CODE_EXTS = [
  '.java', '.kt', '.scala', '.js', '.ts', '.tsx', '.jsx', '.vue',
  '.py', '.go', '.rs', '.c', '.cpp', '.h', '.rb', '.php', '.sql',
];

const TEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 分钟超时
const MAX_BUFFER = 10 * 1024 * 1024; // 10MB 输出上限

function readStdin() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// 注入一条上下文给模型（PostToolUse 用 additionalContext 字段）
function addContext(text) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: text,
      },
    })
  );
  process.exit(0);
}

// 无操作，正常放行
function passThrough() {
  process.exit(0);
}

// 打断：测试失败，把失败信息回传给模型（exit 2 会停止当前流程）
function halt(reason) {
  process.stderr.write(reason);
  process.exit(2);
}

function detectTestCommand(cwd) {
  const isWin = process.platform === 'win32';
  const candidates = [
    ['pom.xml', 'mvn test -q'],
    ['build.gradle', isWin ? 'gradlew.bat test' : './gradlew test'],
    ['build.gradle.kts', isWin ? 'gradlew.bat test' : './gradlew test'],
    ['package.json', 'npm test'],
    ['pyproject.toml', 'pytest -q'],
    ['requirements.txt', 'pytest -q'],
    ['go.mod', 'go test ./...'],
    ['Cargo.toml', 'cargo test -q'],
    ['Makefile', 'make test'],
  ];
  for (const [file, cmd] of candidates) {
    if (fs.existsSync(path.join(cwd, file))) return cmd;
  }
  return null;
}

function main() {
  const event = readStdin();
  const toolName = event.tool_name || '';

  // 只关心「写代码」的工具
  if (!['Edit', 'Write', 'NotebookEdit'].includes(toolName)) return passThrough();

  const filePath =
    (event.tool_input && (event.tool_input.file_path || event.tool_input.notebook_path)) || '';
  if (!filePath) return passThrough();

  const ext = path.extname(filePath).toLowerCase();
  if (!CODE_EXTS.includes(ext)) return passThrough();

  const cwd = event.cwd || process.cwd();

  // 1) 环境变量优先
  let testCmd = process.env.TEST_ON_EDIT_COMMAND || null;

  // 2) 配置文件 .claude/test-command
  if (!testCmd) {
    try {
      const cfg = fs.readFileSync(path.join(cwd, '.claude', 'test-command'), 'utf8').trim();
      if (cfg) testCmd = cfg.split(/\r?\n/)[0];
    } catch (e) {
      /* 无配置文件 */
    }
  }

  // 3) 自动探测
  if (!testCmd) testCmd = detectTestCommand(cwd);
  if (!testCmd) return passThrough(); // 找不到测试命令，不干预

  exec(
    testCmd,
    { cwd, timeout: TEST_TIMEOUT_MS, maxBuffer: MAX_BUFFER },
    (err, stdout, stderr) => {
      if (err) {
        const out = `${stdout}\n${stderr}`.trim();
        halt(`❌ 测试失败，请修复后再继续。\n命令：${testCmd}\n\n${out || err.message}`);
      } else {
        addContext(`✅ 已自动运行测试并通过：${testCmd}（文件 ${path.basename(filePath)}）`);
      }
    }
  );
}

main();
