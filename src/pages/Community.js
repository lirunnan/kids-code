import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Grid,
  Collapse,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import PersonIcon from '@mui/icons-material/Person';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const Community = () => {
  // 状态管理
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentReply, setCurrentReply] = useState({
    messageId: null,
    replyId: null,
    parentReplyId: null,
    content: ''
  });
  const [currentUser, setCurrentUser] = useState(null);

  // 获取当前用户
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      setCurrentUser(user);
    }
  }, []);
  
  // 从localStorage加载消息数据并确保结构正确
  useEffect(() => {
    const savedMessages = localStorage.getItem('communityMessages');
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      // 确保所有消息和回复都有replies数组
      const normalizedMessages = parsedMessages.map(msg => ({
        ...msg,
        replies: (msg.replies || []).map(reply => ({
          ...reply,
          replies: reply.replies || []
        }))
      }));
      setMessages(normalizedMessages);
    }
  }, []);

  // 处理消息输入
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
  };

  // 发送新消息
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;
    
    const newMsg = {
      id: Date.now(),
      user: currentUser ? currentUser.username : '匿名用户',
      content: newMessage,
      timestamp: new Date().toLocaleString(),
      replies: [],
      showReplies: false
    };
    
    const updatedMessages = [newMsg, ...messages];
    setMessages(updatedMessages);
    localStorage.setItem('communityMessages', JSON.stringify(updatedMessages));
    setNewMessage('');
  };

  // 处理回复输入
  const handleReplyChange = (messageId, text) => {
    setMessages(messages.map(msg => 
      msg.id === messageId ? { ...msg, replyText: text } : msg
    ));
  };

  // 发送回复
  // 删除消息或回复
  const handleDelete = (messageId, replyId = null) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id !== messageId) return msg;
      
      if (!replyId) return null; // 删除整个消息

      const removeReply = (replies, targetId) => {
        return replies.filter(reply => reply.id !== targetId)
          .map(reply => ({
            ...reply,
            replies: reply.replies ? removeReply(reply.replies, targetId) : []
          }));
      };

      return {
        ...msg,
        replies: removeReply(msg.replies, replyId)
      };
    }).filter(Boolean);

    setMessages(updatedMessages);
    localStorage.setItem('communityMessages', JSON.stringify(updatedMessages));
  };

  const handleSendReply = (messageId, replyId = null) => {
    if (!currentReply.content || currentReply.messageId !== messageId) {
      return false;
    }

    const newReply = {
      id: Date.now(),
      user: currentUser ? currentUser.username : '用户',
      content: currentReply.content.trim(),
      timestamp: new Date().toLocaleString(),
      replies: []
    };

    const updatedMessages = messages.map(msg => {
      if (msg.id !== messageId) return msg;
      
      if (!replyId) {
        return { ...msg, replies: [...msg.replies, newReply] };
      }

      const addReplyToNested = (replies, targetId) => {
        return replies.map(reply => {
          if (reply.id === targetId) {
            return { ...reply, replies: [...(reply.replies || []), newReply] };
          }
          if (reply.replies?.length) {
            return { ...reply, replies: addReplyToNested(reply.replies, targetId) };
          }
          return reply;
        });
      };

      return { ...msg, replies: addReplyToNested(msg.replies, replyId) };
    });

    setMessages(updatedMessages);
    localStorage.setItem('communityMessages', JSON.stringify(updatedMessages));
    setCurrentReply({ messageId: null, content: '' });
    return true;
  };

  // 切换显示回复
  const toggleReplies = (messageId) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, showReplies: !msg.showReplies };
      }
      return msg;
    });
    setMessages(updatedMessages);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" gutterBottom>
          编程社区
        </Typography>
        <Typography variant="h6" color="text.secondary" mb={3}>
          在这里与其他编程爱好者交流、分享你的想法和作品！
        </Typography>
      </Box>

      {/* 发送消息区域 */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          发布新消息
        </Typography>
        {/* 用户名输入已移除 */}
        <TextField
          fullWidth
          label="分享你的想法..."
          variant="outlined"
          multiline
          rows={3}
          value={newMessage}
          onChange={handleMessageChange}
          sx={{ mb: 2 }}
        />
        <Button 
          variant="contained" 
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={newMessage.trim() === ''}
        >
          发送
        </Button>
      </Paper>

      {/* 消息列表 */}
      <Typography variant="h5" gutterBottom>
        社区讨论
      </Typography>
      <List>
        {messages.map((message) => (
          <Card key={message.id} sx={{ mb: 2 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                </Grid>
                <Grid item xs>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {message.user}
                    </Typography>
                    {(currentUser?.username === message.user || currentUser?.username === 'cxy14') && (
                      <Tooltip title="删除消息">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(message.id);
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {message.timestamp}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {message.content}
                  </Typography>
                </Grid>
              </Grid>

              {/* 回复按钮和回复数量 */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button 
                  startIcon={<ReplyIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleReplies(message.id);
                  }}
                  size="small"
                >
                  回复 ({message.replies.length})
                </Button>
                <IconButton 
                  onClick={() => toggleReplies(message.id)}
                  size="small"
                >
                  {message.showReplies ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>

              {/* 回复区域 */}
              <Collapse in={message.showReplies}>
                <Box mt={2}>
                  {/* 回复列表 */}
                  {message.replies.length > 0 && (
                    <List>
                      {message.replies.map((reply) => (
                        <React.Fragment key={reply.id}>
                          <ListItem alignItems="flex-start" sx={{ pl: 4 }}>
                            <ListItemAvatar>
                              <Avatar sx={{ width: 32, height: 32 }}>
                                <PersonIcon />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between">
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="subtitle2">
                                      {reply.user}
                                    </Typography>
                                    {(currentUser?.username === reply.user || currentUser?.username === 'cxy14') && (
                                      <Tooltip title="删除回复">
                                        <IconButton 
                                          size="small" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(message.id, reply.id);
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {reply.timestamp}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography>{reply.content}</Typography>
                                  <Button 
                                    size="small" 
                                    onClick={() => setCurrentReply({
                                      messageId: message.id,
                                      replyId: reply.id,
                                      parentReplyId: null,
                                      content: `回复 ${reply.user}: `
                                    })}
                                  >
                                    回复
                                  </Button>
                                  {currentReply.replyId === reply.id && (
                                    <Box sx={{ display: 'flex', mt: 1 }}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={`回复 ${reply.user}: `}
                                        variant="outlined"
                                        value={currentReply.content}
                                        onChange={(e) => setCurrentReply({
                                          ...currentReply,
                                          content: e.target.value
                                        })}
                                        sx={{ mr: 1 }}
                                      />
                                      <Button
                                        variant="contained"
                                        size="small"
                                        endIcon={<SendIcon />}
                                        onClick={() => handleSendReply(message.id, reply.id)}
                                        disabled={!currentReply.content}
                                      >
                                        发送
                                      </Button>
                                    </Box>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                          {/* 嵌套回复显示 */}
                          {reply.replies?.length > 0 && (
                            <List>
                              {reply.replies.map(nestedReply => (
                                <React.Fragment key={nestedReply.id}>
                                  <ListItem alignItems="flex-start">
                                    <ListItemAvatar>
                                      <Avatar sx={{ width: 28, height: 28 }}>
                                        <PersonIcon fontSize="small" />
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={
                                        <Box display="flex" justifyContent="space-between">
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <Typography variant="subtitle2">
                                              {nestedReply.user}
                                            </Typography>
                                            {(currentUser?.username === nestedReply.user || currentUser?.username === 'cxy14') && (
                                              <Tooltip title="删除回复">
                                                <IconButton 
                                                  size="small" 
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(message.id, nestedReply.id);
                                                  }}
                                                >
                                                  <DeleteIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            )}
                                          </Box>
                                          <Typography variant="caption" color="text.secondary">
                                            {nestedReply.timestamp}
                                          </Typography>
                                        </Box>
                                      }
                                      secondary={
                                        <Box>
                                          <Typography>{nestedReply.content}</Typography>
                                          <Button 
                                            size="small" 
                                            onClick={() => setCurrentReply({
                                              messageId: message.id,
                                              replyId: nestedReply.id,
                                              content: `回复 ${nestedReply.user}: `
                                            })}
                                          >
                                            回复
                                          </Button>
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                  <Divider variant="inset" component="li" />
                                </React.Fragment>
                              ))}
                            </List>
                          )}
                        </React.Fragment>
                      ))}
                    </List>
                  )}

                  {/* 发送回复的表单 */}
                  <Box display="flex" mt={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {/* 用户名输入已移除 */}
                      <Box sx={{ display: 'flex' }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder={`回复 ${message.user}: `}
                          variant="outlined"
                          value={currentReply.messageId === message.id ? currentReply.content : ''}
                          onChange={(e) => setCurrentReply({
                            ...currentReply,
                            messageId: message.id,
                            content: e.target.value
                          })}
                          sx={{ mr: 1 }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          endIcon={<SendIcon />}
                          onClick={() => handleSendReply(message.id)}
                          disabled={!currentReply.content}
                          sx={{ 
                            '&:hover': { backgroundColor: 'primary.dark' }
                          }}
                        >
                          发送
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </List>
    </Container>
  );
};

export default Community;