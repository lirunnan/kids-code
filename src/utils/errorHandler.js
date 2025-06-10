// 错误类型枚举
export const ErrorType = {
  COMPILATION: 'compilation',
  RUNTIME: 'runtime',
  SYNTAX: 'syntax',
  NETWORK: 'network',
  VALIDATION: 'validation',
  EXECUTION: 'execution',
  SYSTEM: 'system'
};

// 错误码系统
export const ErrorCodes = {
  // 编译错误
  COMPILE_ERROR: { 
    code: 1001, 
    type: ErrorType.COMPILATION,
    message: '编译错误',
    severity: 'high'
  },
  
  // 运行时错误
  RUNTIME_ERROR: {
    code: 2001,
    type: ErrorType.RUNTIME,
    message: '运行时错误', 
    severity: 'high'
  },
  
  // 语法错误
  SYNTAX_ERROR: {
    code: 3001,
    type: ErrorType.SYNTAX,
    message: '语法错误',
    severity: 'medium'
  },
  
  // 网络错误
  NETWORK_ERROR: {
    code: 4001,
    type: ErrorType.NETWORK,
    message: '网络连接错误',
    severity: 'medium'
  },

  // 执行错误
  EXECUTION_ERROR: {
    code: 5001,
    type: ErrorType.EXECUTION,
    message: '代码执行错误',
    severity: 'high'
  },

  // 系统错误
  SYSTEM_ERROR: {
    code: 6001,
    type: ErrorType.SYSTEM,
    message: '系统错误',
    severity: 'high'
  },

  // 未知错误
  UNKNOWN_ERROR: {
    code: 9999,
    type: 'unknown',
    message: '未知错误',
    severity: 'high'
  }
};

// 错误存储系统
const errorStore = new Map();

export class PlaygroundError extends Error {
  constructor(errorCode, details = {}) {
    const errorDef = ErrorCodes[errorCode] || ErrorCodes.UNKNOWN_ERROR;
    
    super(details.message || errorDef.message);
    this.code = errorDef.code;
    this.type = errorDef.type;
    this.severity = errorDef.severity;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // 存储错误以便查询
    errorStore.set(this.code, {
      code: this.code,
      type: this.type,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    });

    // 添加错误上下文
    if (details.code) {
      this.sourceCode = details.code;
      this.lineNumber = details.line;
    }
  }

  getFormattedMessage() {
    let message = `[${this.type}] ${this.code}: ${this.message}\n`;
    if (this.lineNumber) {
      message += `位置：第 ${this.lineNumber} 行\n`;
    }
    if (this.details.originalError) {
      message += `原始错误：${this.details.originalError.message}\n`;
    }
    return message;
  }
}

// 错误查询服务
export const ErrorQueryService = {
  getAllErrors() {
    return Array.from(errorStore.values());
  },
  
  getErrorsByType(type) {
    return this.getAllErrors().filter(err => err.type === type);
  },
  
  getErrorsBySeverity(severity) {
    return this.getAllErrors().filter(err => err.severity === severity);
  },
  
  getErrorByCode(code) {
    return errorStore.get(code);
  },
  
  clearErrors() {
    errorStore.clear();
  },

  getLastError() {
    const errors = this.getAllErrors();
    return errors[errors.length - 1];
  }
};

// 全局错误处理器
export const handlePlaygroundError = (error) => {
  if (error instanceof PlaygroundError) {
    console.groupCollapsed(`[${error.type}] ${error.code}: ${error.message}`);
    console.error('Details:', error.details);
    console.error('Stack:', error.stack);
    console.groupEnd();
    return error;
  }
  
  // 尝试识别错误类型
  let errorCode = 'UNKNOWN_ERROR';
  const details = { originalError: error };

  if (error.message?.includes('编译')) {
    errorCode = 'COMPILE_ERROR';
  } else if (error.message?.includes('语法')) {
    errorCode = 'SYNTAX_ERROR';
  } else if (error.message?.includes('运行时')) {
    errorCode = 'RUNTIME_ERROR';
  } else if (error.message?.includes('执行')) {
    errorCode = 'EXECUTION_ERROR';
  } else if (error.message?.includes('系统')) {
    errorCode = 'SYSTEM_ERROR';
  }

  const playgroundError = new PlaygroundError(errorCode, {
    ...details,
    message: error.message || '程序执行出现未知错误'
  });

  console.error('Playground Error:', {
    code: playgroundError.code,
    type: playgroundError.type,
    message: playgroundError.message,
    details: playgroundError.details
  });

  return playgroundError;
};
