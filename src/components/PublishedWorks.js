import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Snackbar,
  Rating
} from '@mui/material';
import { authService } from '../services/authService';
import CommentDialog from './CommentDialog';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CommentIcon from '@mui/icons-material/Comment';
import ShareIcon from '@mui/icons-material/Share';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SendIcon from '@mui/icons-material/Send';

const PublishedWorks = () => {
  const [publishedWorks, setPublishedWorks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedWork, setExpandedWork] = useState(null);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [currentRunningCode, setCurrentRunningCode] = useState('');
  const [output, setOutput] = useState('');
  const [input, setInput] = useState('');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentWorkId, setCurrentWorkId] = useState(null);

  useEffect(() => {
    // 从localStorage加载已发布的代码
    const loadWorks = () => {
      const works = JSON.parse(localStorage.getItem('publishedCodes') || '[]');
      setPublishedWorks(works);
    };

    // 初始加载
    loadWorks();

    // 添加storage事件监听
    const handleStorageChange = (e) => {
      if (e.key === 'publishedCodes') {
        loadWorks();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // 清理函数
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // 点赞功能
  const handleLike = (workId) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      setSnackbar({
        open: true,
        message: '请先登录后再点赞',
        severity: 'warning'
      });
      return;
    }

    const updatedWorks = publishedWorks.map(work => {
      if (work.id === workId) {
        // 初始化likedBy数组
        const likedBy = work.likedBy || [];
        const userIndex = likedBy.indexOf(currentUser.username);
        
        // 如果用户已点赞，则取消点赞
        if (userIndex !== -1) {
          return {
            ...work,
            likes: work.likes - 1,
            likedBy: likedBy.filter(u => u !== currentUser.username)
          };
        } 
        // 否则添加点赞
        else {
          return {
            ...work,
            likes: work.likes + 1,
            likedBy: [...likedBy, currentUser.username]
          };
        }
      }
      return work;
    });
    setPublishedWorks(updatedWorks);
    localStorage.setItem('publishedCodes', JSON.stringify(updatedWorks));
  };

  const programStateRef = useRef({
    code: '',
    tokens: [],
    currentToken: 0,
    variables: {},
    outputText: '',
    isRunning: false,
    waitingVarName: null
  });

  // 提取cout语句中的字符串和变量
  const extractCoutContent = (line) => {
    const result = [];
    let remainingLine = line;
    
    const stringRegex = /"(.*?)"|'(.*?)'/g;
    let stringMatch;
    
    while ((stringMatch = stringRegex.exec(line)) !== null) {
      const value = stringMatch[1] || stringMatch[2];
      result.push({ type: 'string', value });
      remainingLine = remainingLine.replace(stringMatch[0], '');
    }
    
    const varRegex = /<<\s*(\w+)/g;
    let varMatch;
    
    while ((varMatch = varRegex.exec(remainingLine)) !== null) {
      if (varMatch[1] !== 'endl') {
        result.push({ type: 'variable', name: varMatch[1] });
      }
    }
    
    if (line.includes('endl')) {
      result.push({ type: 'endl' });
    }
    
    return result;
  };

  // 解析代码
  const parseCode = (code) => {
    const tokens = [];
    const lines = code.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('cout <<')) {
        const coutContent = extractCoutContent(line);
        if (coutContent.length > 0) {
          tokens.push({
            type: 'cout',
            content: coutContent,
            line: i
          });
        }
      } 
      else if (line.includes('cin >>')) {
        const varMatch = line.match(/cin\s*>>\s*(\w+)/);
        if (varMatch) {
          tokens.push({
            type: 'cin',
            varName: varMatch[1],
            line: i
          });
        }
      }
    }
    
    return tokens;
  };

  // 继续执行程序
  const continueExecution = () => {
    const state = programStateRef.current;
    
    if (!state.isRunning) return;
    
    while (state.currentToken < state.tokens.length) {
      const token = state.tokens[state.currentToken];
      state.currentToken++;
      
      if (token.type === 'cout') {
        let lineOutput = '';
        
        token.content.forEach(item => {
          if (item.type === 'string') {
            lineOutput += item.value;
          } 
          else if (item.type === 'variable') {
            const varValue = state.variables[item.name] !== undefined 
              ? state.variables[item.name] 
              : '[未定义]';
            lineOutput += varValue;
          }
          else if (item.type === 'endl') {
            lineOutput += '\n';
          }
        });
        
        if (!lineOutput.endsWith('\n')) {
          lineOutput += ' ';
        }
        
        state.outputText += lineOutput;
        setOutput(state.outputText);
      } 
      else if (token.type === 'cin') {
        state.waitingVarName = token.varName;
        setIsWaitingForInput(true);
        return;
      }
    }
    
    if (state.currentToken >= state.tokens.length) {
      state.isRunning = false;
      state.outputText += '\n程序执行完成，返回值: 0\n';
      setOutput(state.outputText);
    }
  };

  // 处理输入提交
  const handleInputSubmit = () => {
    if (!input.trim() || !isWaitingForInput) return;

    const state = programStateRef.current;
    const value = input.trim();
    
    state.outputText += value + '\n';
    setOutput(state.outputText);
    
    if (state.waitingVarName) {
      state.variables[state.waitingVarName] = value;
      state.waitingVarName = null;
    }
    
    setInput('');
    setIsWaitingForInput(false);
    
    setTimeout(() => {
      continueExecution();
    }, 100);
  };

  // 处理按键事件
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && isWaitingForInput) {
      event.preventDefault();
      handleInputSubmit();
    }
  };

  const handleRunCode = (code) => {
    setCurrentRunningCode(code);
    setOutput('正在准备运行环境...');
    setInput('');
    setIsWaitingForInput(false);
    setRunDialogOpen(true);
    
    // 初始化程序状态
    programStateRef.current = {
      code: code,
      tokens: parseCode(code),
      currentToken: 0,
      variables: {},
      outputText: '',
      isRunning: true,
      waitingVarName: null
    };

    // 模拟编译延迟
    setTimeout(() => {
      try {
        if (!code.includes('#include <iostream>') || !code.includes('int main()')) {
          setOutput('编译错误: 代码缺少必要的C++结构\n请确保包含 #include <iostream> 和 int main() 函数');
          programStateRef.current.isRunning = false;
          return;
        }
        
        setOutput('正在运行程序...\n');
        continueExecution();
      } catch (error) {
        setOutput('Error: ' + error.message);
        programStateRef.current.isRunning = false;
      }
    }, 500);
  };

  const handleCloseRunDialog = () => {
    setRunDialogOpen(false);
    setOutput('');
    setInput('');
    setIsWaitingForInput(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const handleCommentSubmit = ({ workId, rating, comment }) => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
      setSnackbar({
        open: true,
        message: '请先登录后再评论',
        severity: 'warning'
      });
      return;
    }

    const updatedWorks = publishedWorks.map(work => {
      if (work.id === workId) {
        const newComment = {
          id: Date.now().toString(),
          author: currentUser.username,
          rating,
          comment,
          timestamp: new Date().toISOString()
        };
        
        return {
          ...work,
          comments: [...(work.comments || []), newComment]
        };
      }
      return work;
    });

    setPublishedWorks(updatedWorks);
    localStorage.setItem('publishedCodes', JSON.stringify(updatedWorks));
    setSnackbar({
      open: true,
      message: '评论已提交',
      severity: 'success'
    });
  };

  // 搜索功能
  const filteredWorks = publishedWorks.filter(work => 
    work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    work.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        作品展示区
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          fullWidth
          placeholder="搜索作品..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {filteredWorks.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          暂无发布的作品
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {filteredWorks.map((work) => (
            <Card key={work.id} elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {work.title}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  发布者: @{work.author}
                </Typography>
                <Typography variant="body2" paragraph>
                  {work.description || '暂无描述'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  发布于: {new Date(work.timestamp).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton 
                  aria-label="like" 
                  onClick={() => handleLike(work.id)}
                  color={(work.likedBy || []).includes(JSON.parse(localStorage.getItem('currentUser'))?.username) ? 'error' : 'default'}
                  disabled={!JSON.parse(localStorage.getItem('currentUser'))}
                >
                  <FavoriteIcon />
                  {work.likes > 0 && (
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {work.likes}
                    </Typography>
                  )}
                </IconButton>
                <IconButton 
                  aria-label="comment" 
                  onClick={() => {
                    setCurrentWorkId(work.id);
                    setCommentDialogOpen(true);
                  }}
                >
                  <CommentIcon />
                </IconButton>
                <IconButton aria-label="share">
                  <ShareIcon />
                </IconButton>
                <Button
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleRunCode(work.code)}
                  sx={{ ml: 1 }}
                >
                  运行
                </Button>
                <Button 
                  size="small" 
                  onClick={() => setExpandedWork(expandedWork === work.id ? null : work.id)}
                  sx={{ ml: 1 }}
                >
                  {expandedWork === work.id ? '收起' : '查看代码'}
                </Button>
                {(JSON.parse(localStorage.getItem('currentUser'))?.username === work.author || 
                  JSON.parse(localStorage.getItem('currentUser'))?.username === 'cxy14') && (
                  <Button 
                    size="small" 
                    color="error"
                    onClick={() => {
                      if (window.confirm('确定要删除这个作品吗？此操作不可撤销！')) {
                        if (authService.deletePublishedWork(work.id)) {
                          const updatedWorks = publishedWorks.filter(w => w.id !== work.id);
                          setPublishedWorks(updatedWorks);
                          localStorage.setItem('publishedCodes', JSON.stringify(updatedWorks));
                          setSnackbar({
                            open: true,
                            message: '作品已删除',
                            severity: 'success'
                          });
                        } else {
                          setSnackbar({
                            open: true,
                            message: '删除失败',
                            severity: 'error'
                          });
                        }
                      }
                    }}
                    sx={{ ml: 1 }}
                  >
                    删除
                  </Button>
                )}
              </CardActions>
              {expandedWork === work.id && (
                <CardContent sx={{ bgcolor: '#f5f5f5', p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      代码:
                    </Typography>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 1, 
                        bgcolor: '#272822',
                        color: '#f8f8f2',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '200px'
                      }}
                    >
                      <pre style={{ margin: 0 }}>{work.code}</pre>
                    </Paper>
                  </Box>

                </CardContent>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* 代码运行对话框 */}
      <Dialog 
        open={runDialogOpen} 
        onClose={handleCloseRunDialog} 
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>运行代码</DialogTitle>
        <DialogContent>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2,
              bgcolor: '#272822',
              color: '#f8f8f2',
              fontFamily: 'monospace',
              fontSize: '12px',
              mb: 2,
              overflow: 'auto',
              maxHeight: '200px'
            }}
          >
            <pre style={{ margin: 0 }}>{currentRunningCode}</pre>
          </Paper>

          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              variant="outlined"
              placeholder={isWaitingForInput ? "程序等待输入..." : "程序未运行"}
              disabled={!isWaitingForInput}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleInputSubmit}
                      disabled={!isWaitingForInput}
                      color="primary"
                    >
                      <SendIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                backgroundColor: isWaitingForInput ? '#e8f5e9' : '#fff'
              }}
            />
          </Box>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2,
              bgcolor: '#1e1e1e',
              color: '#fff',
              fontFamily: 'monospace',
              minHeight: '150px',
              maxHeight: '300px',
              overflow: 'auto',
              mb: 2
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ color: '#666' }}>
              输出结果：
            </Typography>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {output || '准备运行代码...'}
            </pre>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              onClick={handleCloseRunDialog}
              sx={{ mr: 1 }}
            >
              关闭
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => handleRunCode(currentRunningCode)}
              disabled={programStateRef.current.isRunning}
            >
              {programStateRef.current.isRunning ? '运行中...' : '重新运行'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      <CommentDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        workId={currentWorkId}
        onSubmit={handleCommentSubmit}
        comments={publishedWorks.find(work => work.id === currentWorkId)?.comments || []}
      />

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
    </Box>
  );
};

export default PublishedWorks;
