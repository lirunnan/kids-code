import React, { useState, useRef, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box,
  Paper,
  Button,
  Snackbar,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import { 
  ErrorType, 
  ErrorCodes, 
  PlaygroundError, 
  ErrorQueryService, 
  handlePlaygroundError 
} from '../utils/errorHandler';

/* global ace */
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-dracula';
import 'ace-builds/src-noconflict/theme-tomorrow_night';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ShareIcon from '@mui/icons-material/Share';
import PublishedWorks from '../components/PublishedWorks';

// 版本标识 - 强制更新用
const ERROR_HANDLER_VERSION = '1.0.2';

const Playground = () => {
  // 全局错误处理器
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('未处理的Promise拒绝:', event.reason);
      setOutput(`⚠️ 未处理的异步错误: ${event.reason.message || '未知错误'}`);
    };

    const handleUncaughtError = (event) => {
      console.error('未捕获的异常:', event.error);
      setOutput(`⚠️ 未捕获的异常: ${event.error.message || '未知错误'}`);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleUncaughtError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleUncaughtError);
    };
  }, []);

  // 增强的错误处理功能
  const handleCompilationError = (error) => {
    // 尝试从错误堆栈中提取行号
    let lineNumber = error.lineNumber;
    if (!lineNumber && error.stack) {
      const stackMatch = error.stack.match(/<anonymous>:(\d+):\d+/);
      if (stackMatch) {
        lineNumber = parseInt(stackMatch[1]);
      }
    }
    
    const appError = new PlaygroundError('COMPILE_ERROR', {
      originalError: error,
      code: code,
      line: lineNumber
    });
    
    // 格式化错误输出
    let formattedOutput = `[${new Date().toLocaleString()}]\n`;
    formattedOutput += `🔴 错误类型: ${appError.type}\n`;
    formattedOutput += `📌 错误码: ${appError.code}\n`;
    formattedOutput += `📌 错误信息: ${appError.message}\n\n`;
    
    if (lineNumber) {
      formattedOutput += `📍 错误位置: <a href="#" onclick="document.getElementById('code-editor').env.editor.gotoLine(${lineNumber}); return false;" style="color: #ff5252; font-weight: bold;">第 ${lineNumber} 行</a>\n\n`;
      
      // 显示错误行上下文
      const codeLines = code.split('\n');
      const start = Math.max(0, lineNumber - 3);
      const end = Math.min(codeLines.length, lineNumber + 2);
      formattedOutput += '📋 相关代码:\n';
      for (let i = start; i < end; i++) {
        const isErrorLine = i === lineNumber - 1;
        const lineStyle = isErrorLine ? 'background-color: #ffebee; color: #d32f2f;' : '';
        formattedOutput += `<div style="${lineStyle}">${i === lineNumber - 1 ? '❯ ' : '  '}${i + 1}: ${codeLines[i]}</div>`;
        if (isErrorLine) {
          const indent = codeLines[i].match(/^\s*/)[0].length;
          formattedOutput += '<div style="color: #d32f2f;">' + ' '.repeat(indent + 3) + '^'.repeat(codeLines[i].trim().length) + '</div>\n';
        }
      }
      
      formattedOutput += `\n💡 快速修复: 检查<a href="#" onclick="document.getElementById('code-editor').env.editor.gotoLine(${lineNumber})" style="color: #ff5252; font-weight: bold;">第 ${lineNumber} 行</a>代码语法或逻辑`;
      
      // 自动滚动到错误行
      if (window.ace) {
        try {
          const editor = ace.edit('code-editor');
          if (editor && typeof editor.gotoLine === 'function') {
            editor.gotoLine(lineNumber, 0, true);
            editor.scrollToLine(lineNumber - 3);
            editor.session.setAnnotations([{
              row: lineNumber - 1,
              column: 0,
              text: appError.message,
              type: 'error'
            }]);
          }
        } catch (e) {
          console.warn('编辑器跳转失败:', e);
        }
      }
    } else {
      formattedOutput += '⚠️ 无法确定错误具体位置\n';
    }
    
    formattedOutput += `\n\n<!-- ErrorHandler v${ERROR_HANDLER_VERSION} -->`;
    setOutput(formattedOutput);
    return appError;
  };
  const [activeTab, setActiveTab] = useState('editor');
  const [publishedWorks, setPublishedWorks] = useState([]);
  const [showOutput, setShowOutput] = useState(true);
  
  useEffect(() => {
    // 从localStorage加载已发布的代码
    const works = JSON.parse(localStorage.getItem('publishedCodes') || '[]');
    setPublishedWorks(works);
  }, []);
  // 状态管理
  const [code, setCode] = useState(
`#include <iostream>
using namespace std;

int main() {
    int number;
    cout << "请输入一个数字：" << endl;
    cin >> number;
    cout << "你输入的数字是：" << number << endl;
    cout << "请再输入一个数字：" << endl;
    cin >> number;
    cout << "你输入的第二个数字是：" << number << endl;
    return 0;
}`
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // 发布相关状态
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishTitle, setPublishTitle] = useState('');
  const [publishDescription, setPublishDescription] = useState('');
  const [publishAuthor, setPublishAuthor] = useState('');

  // 程序执行状态
  const programStateRef = useRef({
    code: '',
    tokens: [],
    currentToken: 0,
    variables: {},
    outputText: '',
    isRunning: false,
    waitingVarName: null,
    loopStack: [],
    isWaitingForMazeInput: false,
    isMazeActive: false,
    mazeOutput: ''
  });

  // 处理代码变化
  const handleCodeChange = (event) => {
    setCode(event.target.value);
  };

  // 编辑器配置
  const editorOptions = {
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    enableSnippets: true,
    showLineNumbers: true,
    tabSize: 4,
    useSoftTabs: true,
    wrapEnabled: true
  };

  // 预处理代码 - 添加万能头文件
  const preprocessCode = (code) => {
    if (!code.includes('#include <bits/stdc++.h>')) {
      return code;
    }
    
    const stdIncludes = [
      '#include <iostream>',
      '#include <vector>',
      '#include <algorithm>',
      '#include <string>',
      '#include <map>',
      '#include <set>',
      '#include <queue>',
      '#include <stack>',
      '#include <cmath>',
      '#include <cstdio>',
      '#include <cstdlib>',
      '#include <cstring>'
    ].join('\n');
    
    return code.replace('#include <bits/stdc++.h>', stdIncludes);
  };

  // 处理输入变化
  const handleInputChange = (value) => {
    setInput(value);
  };

  // 调试工具函数
  const debugState = (state, message = '') => {
    console.group(`程序状态 ${message}`);
    console.log('当前token:', state.currentToken);
    console.log('变量:', state.variables);
    console.log('输出:', state.outputText);
    console.log('等待输入:', state.waitingVarName);
    console.log('循环栈:', state.loopStack);
    console.groupEnd();
  };

  // 提取cout语句中的字符串和变量
  const extractCoutContent = (line) => {
    const result = [];
    let remainingLine = line;
    let hasEndl = false;
    
    // 匹配所有字符串
    const stringRegex = /"([^"]*?)"|'([^']*?)'/g;
    let stringMatch;
    
    while ((stringMatch = stringRegex.exec(line)) !== null) {
      const value = stringMatch[1] || stringMatch[2];
      result.push({ type: 'string', value });
      remainingLine = remainingLine.replace(stringMatch[0], '');
    }
    
    // 匹配endl
    if (remainingLine.includes('endl')) {
      result.push({ type: 'endl' });
      remainingLine = remainingLine.replace(/\s*<<\s*endl\s*/g, '');
      hasEndl = true;
    }
    
    // 匹配所有变量（在移除字符串和endl后）
    const varRegex = /<<\s*(\w+)/g;
    let varMatch;
    
    while ((varMatch = varRegex.exec(remainingLine)) !== null) {
      result.push({ type: 'variable', name: varMatch[1] });
    }
    
    // 确保每个cout语句后都有换行
    if (!hasEndl) {
      result.push({ type: 'endl' });
    }
    
    console.log('解析cout内容:', { line, result });
    return result;
  };

  // 提取scanf参数
  const extractScanfParams = (line) => {
    const result = [];
    // 匹配scanf("格式字符串", &变量1, &变量2, ...)
    const match = line.match(/scanf\s*\(\s*"([^"]*)"\s*,\s*([^)]*)\)/);
    if (!match) return result;

    const format = match[1];
    const vars = match[2].split(',').map(v => v.trim());
    
    // 解析格式字符串中的占位符
    const formatSpecifiers = format.match(/%[difscu]/g) || [];
    
    // 处理每个变量
    vars.forEach((variable, index) => {
      // 移除&符号
      const varName = variable.replace(/&/, '').trim();
      const type = formatSpecifiers[index] || '%d'; // 默认为整数
      result.push({
        name: varName,
        type: type
      });
    });

    console.log('解析scanf参数:', { format, vars, result });
    return result;
  };

  // 严格模式代码解析器
  const parseCode = (code) => {
    const tokens = [];
    const lines = code.split('\n');
    let inMainFunction = false;
    let braceDepth = 0;

    // 首先检查基本语法结构
    if (!code.includes('int main()')) {
      throw new Error('程序必须包含 int main() 函数');
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行和注释
      if (!line || line.startsWith('//')) continue;

      // 检测main函数开始
      if (line.includes('int main()')) {
        if (inMainFunction) {
          throw new Error(`第 ${i+1} 行: 重复的main函数定义`);
        }
        inMainFunction = true;
        continue;
      }

      // 跟踪大括号深度
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // 解析cout语句
      if (line.includes('cout')) {
        const coutMatch = line.match(/cout\s*(<<[^;]+);/);
        if (coutMatch) {
          const coutContent = extractCoutContent(line);
          if (coutContent.length > 0) {
            tokens.push({
              type: 'cout',
              content: coutContent,
              line: i,
              valid: true,
              originalLine: line
            });
            console.log('添加cout token:', tokens[tokens.length - 1]);
          }
        }
      }
      // 解析cin语句
      else if (line.includes('cin')) {
        const cinMatch = line.match(/cin\s*>>\s*(\w+)\s*;/);
        if (cinMatch && cinMatch[1]) {
          tokens.push({
            type: 'cin',
            varName: cinMatch[1],
            line: i,
            valid: true,
            originalLine: line
          });
          console.log('添加cin token:', tokens[tokens.length - 1]);
        }
      }
      // 解析scanf语句
      else if (line.includes('scanf')) {
        const scanfParams = extractScanfParams(line);
        if (scanfParams.length > 0) {
          tokens.push({
            type: 'scanf',
            params: scanfParams,
            line: i,
            valid: true,
            originalLine: line
          });
          console.log('添加scanf token:', tokens[tokens.length - 1]);
        }
      }
      // 解析gets/getchar语句
      else if (line.includes('gets(') || line.includes('getchar(')) {
        const getsMatch = line.match(/gets\s*\(\s*(\w+)\s*\)/);
        const getcharMatch = line.match(/getchar\s*\(\s*\)/);
        
        if (getsMatch) {
          tokens.push({
            type: 'gets',
            varName: getsMatch[1],
            line: i,
            valid: true,
            originalLine: line
          });
          console.log('添加gets token:', tokens[tokens.length - 1]);
        } else if (getcharMatch) {
          tokens.push({
            type: 'getchar',
            line: i,
            valid: true,
            originalLine: line
          });
          console.log('添加getchar token:', tokens[tokens.length - 1]);
        }
      }
      // 解析for循环
      else if (line.startsWith('for')) {
        const forMatch = line.match(/for\s*\((.*?);(.*?);(.*?)\)/);
        if (forMatch) {
          tokens.push({
            type: 'for_loop',
            line: i,
            code: line,
            init: forMatch[1],
            condition: forMatch[2],
            increment: forMatch[3],
            valid: true
          });
        }
      }

      // 处理代码块结束
      if (braceDepth <= 0 && inMainFunction) {
        if (tokens.some(t => t.type === 'for_loop')) {
          tokens.push({
            type: 'end_block',
            line: i,
            valid: true
          });
        }
        inMainFunction = false;
      }
    }

    if (braceDepth > 0) {
      throw new Error('缺少闭合大括号');
    }

    console.log('解析完成，生成的tokens:', tokens);
    return tokens;
  };

  // 增强版执行引擎
  const continueExecution = () => {
    const state = programStateRef.current;
    if (!state.isRunning) return;

    try {
      while (state.currentToken < state.tokens.length) {
        const token = state.tokens[state.currentToken];
        state.currentToken++;

        switch (token.type) {
          case 'cout':
            let output = '';
            token.content.forEach(item => {
              if (item.type === 'string') {
                output += item.value;
              } else if (item.type === 'variable') {
                const varValue = state.variables[item.name];
                if (varValue === undefined) {
                  throw new Error(`使用未初始化的变量: ${item.name}`);
                }
                output += varValue;
              } else if (item.type === 'endl') {
                output += '\n';
              }
            });
            
            // 检查特殊标记
            if (output.includes('#MAZE_READY#')) {
              // 迷宫已生成，开始游戏
              state.isMazeActive = true;
              state.mazeOutput = output.split('#MAZE_READY#')[0];
              setOutput(state.mazeOutput + '\n使用 W/A/S/D 移动，ESC 退出游戏');
              
              // 启动按键监听
              window.addEventListener('keydown', handleMazeKeyPress);
              return;
            } else if (output.includes('#MAZE_UPDATED#')) {
              // 迷宫状态已更新
              state.mazeOutput = output.split('#MAZE_UPDATED#')[0];
              setOutput(state.mazeOutput + '\n使用 W/A/S/D 移动，ESC 退出游戏');
              return;
            } else if (output.includes('#MAZE_COMPLETE#')) {
              // 游戏完成
              state.isMazeActive = false;
              window.removeEventListener('keydown', handleMazeKeyPress);
              setOutput(output.split('#MAZE_COMPLETE#')[0] + '\n恭喜你到达终点！');
              return;
            }
            
            state.outputText += output;
            // 确保每个cout输出后都有换行
            if (!output.endsWith('\n')) {
              state.outputText += '\n';
            }
            setOutput(state.outputText);
            break;

          case 'cin':
            if (state.isMazeActive) {
              // 在迷宫模式下，输入由按键事件处理
              return;
            }
            
            console.log('处理输入语句:', token);
            state.waitingVarName = token.varName;
            setIsWaitingForInput(true);
            setOutput(state.outputText + `\n[等待输入] 请输入 ${state.waitingVarName} 的值: `);
            return;

          case 'scanf':
            if (state.isMazeActive) {
              // 在迷宫模式下，跳过普通输入处理
              return;
            }
            
            console.log('处理输入语句:', token);
            state.waitingVarNames = token.params.map(p => p.name);
            state.waitingVarTypes = token.params.map(p => p.type);
            state.currentWaitingVar = 0;
            state.waitingVarName = state.waitingVarNames[0];
            
            setIsWaitingForInput(true);
            
            // 根据不同的输入类型显示不同的提示
            let prompt = '\n[等待输入] ';
            switch (token.type) {
              case 'scanf':
                prompt += `请按格式 ${state.waitingVarTypes.join(' ')} 输入 ${state.waitingVarNames.join(', ')}: `;
                break;
              default:
                prompt += `请输入 ${state.waitingVarName} 的值: `;
            }
            
            setOutput(state.outputText + prompt);
            return;

          case 'gets':
            if (state.isMazeActive) {
              // 在迷宫模式下，跳过普通输入处理
              return;
            }
            
            console.log('处理输入语句:', token);
            state.waitingVarName = token.varName;
            setIsWaitingForInput(true);
            setOutput(state.outputText + '请输入一行文本: ');
            return;

          case 'getchar':
            if (state.isMazeActive) {
              // 在迷宫模式下，跳过普通输入处理
              return;
            }
            
            console.log('处理输入语句:', token);
            state.waitingVarName = '_getchar_';
            setIsWaitingForInput(true);
            setOutput(state.outputText + '请输入一个字符: ');
            return;

          case 'for_loop':
            const match = token.code.match(/for\s*\((.*?);(.*?);(.*?)\)/);
            if (match) {
              const [_, init, condition, increment] = match;
              console.log('解析到for循环:', {init, condition, increment});
              
              // 初始化循环变量
              if (init.includes('=')) {
                const [varName, value] = init.split('=').map(s => s.trim());
                state.variables[varName] = parseInt(value) || 0;
                console.log('初始化循环变量:', varName, '=', state.variables[varName]);
              }
              
              // 首次检查循环条件
              if (evalCondition(condition, state.variables)) {
                state.loopStack = state.loopStack || [];
                state.loopStack.push({
                  increment,
                  condition,
                  startToken: state.currentToken,
                  endToken: null,
                  loopVar: init.split('=')[0].trim()
                });
                console.log('进入循环体，当前变量值:', state.variables);
              }
            }
            break;
        }

        // 处理循环逻辑
        if (state.loopStack && state.loopStack.length > 0) {
          const currentLoop = state.loopStack[state.loopStack.length - 1];
          
          if (currentLoop.endToken === null && 
              state.tokens[state.currentToken]?.type === 'end_block') {
            currentLoop.endToken = state.currentToken + 1;
            console.log('设置循环结束位置:', currentLoop.endToken);
          }
          
          if (currentLoop.endToken !== null) {
            if (!evalCondition(currentLoop.condition, state.variables)) {
              console.log('循环条件不满足，退出循环');
              state.loopStack.pop();
            } else {
              if (currentLoop.increment.includes('++')) {
                const varName = currentLoop.increment.replace('++', '').trim();
                state.variables[varName] = parseInt(state.variables[varName] || 0) + 1;
                console.log('递增循环变量:', varName, '=', state.variables[varName]);
              }
              state.currentToken = currentLoop.startToken;
              console.log('跳回循环开始位置:', state.currentToken);
            }
          }
        }
      }

      // 程序执行完成
      if (state.currentToken >= state.tokens.length) {
        console.log('程序执行完成，最终状态:', state);
        state.isRunning = false;
        
        if (state.isMazeActive) {
          window.removeEventListener('keydown', handleMazeKeyPress);
        }
        
        if (!state.outputText.trim()) {
          state.outputText = '程序执行完成，无输出\n';
        }
        
        if (!state.outputText.endsWith('\n')) {
          state.outputText += '\n';
        }
        
        setOutput(state.outputText + '程序执行完成，返回值: 0');
        
        setIsWaitingForInput(false);
        state.waitingVarName = null;
        state.isMazeActive = false;
      }
    } catch (error) {
      console.error('程序执行错误:', error);
      state.isRunning = false;
      setIsWaitingForInput(false);
      
      if (state.isMazeActive) {
        window.removeEventListener('keydown', handleMazeKeyPress);
        state.isMazeActive = false;
      }
      
      let errorOutput = `🚨 运行时错误:\n`;
      errorOutput += `${error.message}\n`;
      if (error.stack) {
        errorOutput += `\n调用栈:\n${error.stack.split('\n').slice(0, 3).join('\n')}\n`;
      }
      setOutput(state.outputText + '\n' + errorOutput);
    }
  };

  // 辅助函数：评估条件表达式
  const evalCondition = (condition, variables) => {
    if (!condition || !variables) return false;
    
    try {
      // 替换变量名为实际值
      const expr = condition
        .replace(/([a-zA-Z_]\w*)/g, (match) => {
          return variables[match] !== undefined ? variables[match] : '0';
        })
        .replace(/<=/g, '<=').replace(/>=/g, '>=');
      
      // 安全评估表达式
      return new Function(`return ${expr};`)();
    } catch (fatalError) {
      console.error('条件评估错误:', fatalError);
      return false;
    }
  };

  // 运行代码
  const handleRunCode = async () => {
    try {
      setOutput('正在编译并运行...\n');
      setIsWaitingForInput(false);
      setShowOutput(true);
      
      // 预处理代码
      const processedCode = preprocessCode(code);
      console.log('预处理后的代码:', processedCode);
      
      // 解析代码生成tokens
      const tokens = parseCode(processedCode);
      console.log('生成的tokens:', tokens);
      
      if (tokens.length === 0) {
        setOutput('警告: 没有找到可执行的语句\n');
        return;
      }
      
      // 重置程序状态
      const state = {
        code: processedCode,
        tokens: tokens,
        currentToken: 0,
        variables: {},
        outputText: '',
        isRunning: true,
        waitingVarName: null,
        loopStack: [],
        isWaitingForMazeInput: false,
        isMazeActive: false,
        mazeOutput: ''
      };
      
      programStateRef.current = state;
      debugState(state, '初始化');

      // 开始执行程序
      continueExecution();
    } catch (error) {
      console.error('代码执行错误:', error);
      setOutput(`🚨 错误:\n${error.message}\n`);
    }
  };

  // 严格语法验证函数
  const validateSyntax = (code) => {
    const errors = [];
    const lines = code.split('\n');
    let braceBalance = 0;
    let inMain = false;

    // 检查基本结构
    if (!code.includes('int main()')) {
      errors.push('程序必须包含 int main() 函数');
    }

    // 合法的语句模式
    const validPatterns = [
      /^using\s+namespace\s+std\s*;$/,  // using namespace std;
      /^#include\s*<[\w.]+>\s*$/,       // #include <xxx>
      /^int\s+main\s*\(\s*\)\s*{\s*$/,  // int main() {
      /^int\s+[\w_][\w\d_]*\s*;$/,      // int xxx;
      /^int\s+[\w_][\w\d_]*\s*=\s*\d+\s*;$/, // int xxx = 123;
      /^float\s+[\w_][\w\d_]*\s*;$/,    // float xxx;
      /^double\s+[\w_][\w\d_]*\s*;$/,   // double xxx;
      /^char\s+[\w_][\w\d_]*\s*;$/,     // char xxx;
      /^string\s+[\w_][\w\d_]*\s*;$/,   // string xxx;
      /^bool\s+[\w_][\w\d_]*\s*;$/,     // bool xxx;
      /^void\s+[\w_][\w\d_]*\s*\([^)]*\)\s*{\s*$/,  // void xxx() {
      /^return\s+.*?;$/,                // return xxx;
      /^return\s*;$/,                   // return;
      /^cout\s*<<\s*.*?(?:<<\s*endl\s*)?;$/,  // cout << xxx << endl;
      /^cin\s*>>\s*[\w_][\w\d_]*\s*;$/, // cin >> xxx;
      /^[\w_][\w\d_]*\s*=\s*.+;$/,     // xxx = xxx;
      /^if\s*\(.*\)\s*{\s*$/,          // if (...) {
      /^}\s*else\s*{\s*$/,             // } else {
      /^for\s*\(.*\)\s*{\s*$/,         // for (...) {
      /^while\s*\(.*\)\s*{\s*$/,       // while (...) {
      /^do\s*{\s*$/,                   // do {
      /^}\s*while\s*\(.*\)\s*;$/,      // } while (...);
      /^{\s*$/,                        // {
      /^}\s*$/,                        // }
      /^\/\/.*$/,                      // 注释
      /^$/,                            // 空行
      /^system\s*\(\s*".*"\s*\)\s*;$/, // system("xxx");
      /^Sleep\s*\(\s*\d+\s*\)\s*;$/,   // Sleep(xxx);
      /^memset\s*\(.*\)\s*;$/,         // memset(...);
      /^srand\s*\(.*\)\s*;$/,          // srand(...);
      /^random_shuffle\s*\(.*\)\s*;$/,  // random_shuffle(...);
      /^vector\s*<.*>\s*.*?;$/,        // vector<...> xxx;
      /^_kbhit\s*\(\s*\)\s*;$/,        // _kbhit();
      /^getch\s*\(\s*\)\s*;$/,         // getch();
      /^toupper\s*\(.*\)\s*;$/,        // toupper(...);
      /^switch\s*\(.*\)\s*{\s*$/,      // switch (...) {
      /^case\s+.*:.*$/,                // case xxx:
      /^break\s*;$/,                   // break;
      /^exit\s*\(\s*\d+\s*\)\s*;$/     // exit(xxx);
    ];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 跳过空行和注释
      if (!trimmedLine || trimmedLine.startsWith('//')) return;

      // 检查main函数
      if (trimmedLine.includes('int main()')) {
        if (inMain) {
          errors.push(`第 ${index+1} 行: 重复的main函数定义`);
        }
        inMain = true;
      }

      // 检查大括号平衡
      braceBalance += (line.match(/{/g) || []).length;
      braceBalance -= (line.match(/}/g) || []).length;

      // 检查语句完整性
      if (trimmedLine.endsWith(';') || trimmedLine.endsWith('{') || trimmedLine.endsWith('}')) {
        // 检查是否匹配任何合法模式
        const isValidStatement = validPatterns.some(pattern => {
          try {
            return pattern.test(trimmedLine);
          } catch (e) {
            console.warn('正则表达式匹配错误:', e);
            return false;
          }
        });
        
        if (!isValidStatement) {
          console.log('未匹配的语句:', trimmedLine);
          console.log('当前行号:', index + 1);
        }
      }
    });

    return errors;
  };

  // 复制代码
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setSnackbar({
      open: true,
      message: '代码已复制到剪贴板',
      severity: 'success'
    });
  };

  // 彻底清空编程学习中心
  const handleClearCode = () => {
    // 1. 完全清空编辑器状态
    setCode('');
    setInput('');
    setOutput('');
    setIsWaitingForInput(false);
    
    // 2. 强制清空作品列表和本地存储
    localStorage.setItem('publishedCodes', '[]');
    setPublishedWorks([]);
    
    // 3. 停止程序执行
    if (programStateRef.current) {
      programStateRef.current = {
        code: '',
        tokens: [],
        currentToken: 0,
        variables: {},
        outputText: '',
        isRunning: false,
        waitingVarName: null
      };
    }
    
    // 4. 显示清空成功提示
    setSnackbar({
      open: true,
      message: '编程学习中心已清空',
      severity: 'success'
    });
  };

  // 关闭提示
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  // 打开发布对话框
  const handleOpenPublishDialog = () => {
    setPublishDialogOpen(true);
  };

  // 关闭发布对话框
  const handleClosePublishDialog = () => {
    setPublishDialogOpen(false);
    setPublishTitle('');
    setPublishDescription('');
    setPublishAuthor('');
  };

  // 发布代码
  const handlePublish = () => {
    if (!publishTitle.trim() || !code.trim()) {
      setSnackbar({
        open: true,
        message: '请填写标题和代码',
        severity: 'error'
      });
      return;
    }

    // 获取已发布的代码列表
    const publishedCodes = JSON.parse(localStorage.getItem('publishedCodes') || '[]');

    // 创建新的发布项
    const newPublishedCode = {
      id: Date.now(),
      title: publishTitle,
      description: publishDescription,
      author: JSON.parse(localStorage.getItem('currentUser'))?.username || '匿名用户',
      code: code,
      timestamp: new Date().toISOString(),
      language: 'cpp',
      likes: 0,
      comments: []
    };

    // 添加到列表并保存
    publishedCodes.push(newPublishedCode);
    localStorage.setItem('publishedCodes', JSON.stringify(publishedCodes));
    setPublishedWorks([...publishedCodes]); // 确保状态更新

    // 关闭对话框并显示成功消息
    handleClosePublishDialog();
    setSnackbar({
      open: true,
      message: '代码已成功发布到成品展示区',
      severity: 'success'
    });
    setActiveTab('gallery');
  };

  // 处理迷宫按键事件
  const handleMazeKeyPress = (event) => {
    const state = programStateRef.current;
    if (!state || !state.isMazeActive) return;
    
    event.preventDefault();
    
    // 处理ESC键退出
    if (event.key === 'Escape') {
      setInput('EXIT\n');
      handleInputSubmit();
      window.removeEventListener('keydown', handleMazeKeyPress);
      state.isMazeActive = false;
      return;
    }
    
    // 处理移动键
    const key = event.key.toUpperCase();
    if (['W', 'A', 'S', 'D'].includes(key)) {
      setInput(`MOVE\n${key}\n`);
      handleInputSubmit();
    }
  };

  // 处理按键事件
  const handleKeyPress = (event) => {
    if (!isWaitingForInput) return;
    
    const state = programStateRef.current;
    
    // 检查是否在迷宫模式
    const isMazeMode = state.outputText.includes('请输入移动方向 (W/A/S/D)') || 
                      state.outputText.includes('无法移动！') ||
                      state.outputText.includes('当前迷宫状态:');
    
    if (isMazeMode) {
      const key = event.key.toUpperCase();
      if (['W', 'A', 'S', 'D', 'Q'].includes(key)) {
        event.preventDefault();
        setInput(key);
        handleInputSubmit();
      }
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleInputSubmit();
    }
  };

  // 处理输入提交
  const handleInputSubmit = () => {
    if (!input.trim() || !isWaitingForInput) {
      return;
    }

    const state = programStateRef.current;
    const value = input.trim();
    
    // 检查是否在迷宫模式
    const isMazeMode = state.outputText.includes('请输入移动方向 (W/A/S/D)') || 
                      state.outputText.includes('无法移动！') ||
                      state.outputText.includes('当前迷宫状态:');
    
    // 记录用户输入到输出
    if (!isMazeMode || value === 'Q') {
      state.outputText += value + '\n';
    }
    setOutput(state.outputText);
    
    // 设置变量值
    if (state.waitingVarName) {
      state.variables[state.waitingVarName] = value;
    }
    
    setInput('');
    setIsWaitingForInput(false);
    
    // 继续执行
    setTimeout(() => {
      continueExecution();
    }, 50);
  };

  // 初始化程序状态
  const initializeProgramState = () => {
    return {
      code: '',
      tokens: [],
      currentToken: 0,
      variables: {},
      outputText: '',
      isRunning: false,
      waitingVarName: null,
      loopStack: [],
      isMazeActive: false,
      mazeOutput: ''
    };
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom>
          C++ 编程乐园
        </Typography>
        <Typography variant="h6" color="text.secondary">
          在线编写、编译和运行 C++ 代码
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant={activeTab === 'editor' ? 'contained' : 'outlined'}
          onClick={() => setActiveTab('editor')}
        >
          代码编辑器
        </Button>
        <Button
          variant={activeTab === 'gallery' ? 'contained' : 'outlined'}
          onClick={() => {
            setActiveTab('gallery');
            setShowOutput(false);
          }}
        >
          作品展示区
        </Button>
      </Box>

      {activeTab === 'editor' && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrowIcon />}
            onClick={handleRunCode}
            disabled={isWaitingForInput}
          >
            运行
          </Button>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopyCode}
          >
            复制代码
          </Button>
          <Button
            variant="outlined"
            startIcon={<ErrorIcon />}
            onClick={() => {
              const errors = JSON.parse(localStorage.getItem('codeErrors') || '[]');
              setOutput(`最近错误记录(${errors.length}条):\n` + 
                errors.map(e => `[${new Date(e.timestamp).toLocaleString()}] ${e.type}: ${e.message}`).join('\n'));
            }}
          >
            查看错误历史
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleClearCode}
            disabled={isWaitingForInput}
          >
            清空
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<ShareIcon />}
            onClick={handleOpenPublishDialog}
          >
            发布到成品展示区
          </Button>
        </Box>
      )}

      {activeTab === 'editor' ? (
        <Paper 
          elevation={3} 
          sx={{ 
            mb: 2,
            bgcolor: '#272822'
          }}
        >
        <AceEditor
          mode="c_cpp"
          theme={window.ace ? 'dracula' : 'monokai'}
          value={code}
          onChange={setCode}
          name="code-editor"
          id="code-editor"
          width="100%"
          height="500px"
          fontSize={14}
          showPrintMargin={false}
          setOptions={editorOptions}
          editorProps={{ $blockScrolling: true }}
          style={{
            backgroundColor: '#282a36',
            borderRadius: '4px'
          }}
        />
      </Paper>
      ) : (
        <PublishedWorks />
      )}

      {showOutput && (
        <>
          <Box sx={{ mb: 2 }}>
            <AceEditor
              mode="text"
              theme="dracula"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              name="input-editor"
              width="100%"
              height="80px"
              fontSize={14}
              showPrintMargin={false}
              readOnly={!isWaitingForInput}
              placeholder={isWaitingForInput ? "输入内容，按Enter提交。在迷宫中可直接按W/A/S/D移动" : "程序未运行"}
              editorProps={{ $blockScrolling: true }}
              style={{
                backgroundColor: isWaitingForInput ? '#44475a' : '#282a36',
                borderRadius: '4px',
                color: '#f8f8f2'
              }}
              setOptions={{
                showLineNumbers: false,
                showGutter: false,
                highlightActiveLine: false
              }}
            />
            {isWaitingForInput && (
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Button 
                  variant="contained" 
                  onClick={handleInputSubmit}
                  startIcon={<SendIcon />}
                  size="small"
                >
                  提交输入
                </Button>
              </Box>
            )}
          </Box>

          <Box
            component="div"
            dangerouslySetInnerHTML={{
              __html: output || '<div style="color: #888; padding: 16px;">运行程序后将在这里显示输出结果...</div>'
            }}
            sx={{
              backgroundColor: '#282a36',
              color: '#f8f8f2',
              p: 2,
              borderRadius: 1,
              mt: 2,
              height: '500px',
              overflow: 'auto',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              '& a': {
                color: '#ff5252',
                textDecoration: 'none',
                cursor: 'pointer',
                '&:hover': {
                  textDecoration: 'underline'
                }
              },
              '& div': {
                lineHeight: 1.5,
                padding: '2px 0',
                whiteSpace: 'pre'  // 确保保留所有空白字符和换行
              }
            }}
          />
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 发布对话框 */}
      <Dialog open={publishDialogOpen} onClose={handleClosePublishDialog} maxWidth="sm" fullWidth>
        <DialogTitle>发布代码到成品展示区</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ mb: 2 }}>
              <AceEditor
                mode="text"
                theme="monokai"
                value={publishTitle}
                onChange={setPublishTitle}
                name="title-editor"
                width="100%"
                height="50px"
                fontSize={14}
                showPrintMargin={false}
                placeholder="输入标题"
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  showLineNumbers: false,
                  showGutter: false,
                  highlightActiveLine: false
                }}
              />
            </Box>
            <Box sx={{ mb: 2 }}>
              <AceEditor
                mode="text"
                theme="monokai"
                value={publishDescription}
                onChange={setPublishDescription}
                name="description-editor"
                width="100%"
                height="100px"
                fontSize={14}
                showPrintMargin={false}
                placeholder="输入描述（可选）"
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  showLineNumbers: false,
                  showGutter: false,
                  highlightActiveLine: false
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePublishDialog}>取消</Button>
          <Button 
            variant="contained" 
            onClick={handlePublish}
            disabled={!publishTitle.trim() || !code.trim()}
          >
            发布
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Playground;