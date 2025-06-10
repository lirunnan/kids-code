import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Select,
  MenuItem,
  Button,
  Alert,
  Box,
  TextField
} from '@mui/material';
import { authService } from '../services/authService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      // 管理员cxy14可以看到所有用户，普通用户只能看到自己
      const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
      const filteredUsers = currentUser.username === 'cxy14' 
        ? storedUsers.filter(user => user.status !== 'deleted')
        : storedUsers.filter(user => user.username === currentUser.username);
      setUsers(filteredUsers);
    }
  }, []);
  const [message, setMessage] = useState('');
  const [passwordChange, setPasswordChange] = useState({
    username: '',
    oldPassword: '',
    newPassword: ''
  });


  const handleRoleChange = (username, newRole) => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.username === 'cxy14') {
      if (authService.updateUserRole(username, newRole)) {
        setUsers(users.map(user => 
          user.username === username ? { 
            ...user, 
            role: newRole,
            isReviewer: newRole === 'admin' || newRole === 'reviewer'
          } : user
        ));
        setMessage(`已成功将用户 ${username} 的角色修改为 ${newRole}`);
      } else {
        setMessage('角色修改失败');
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };
  const handlePasswordChange = (username) => {
    setPasswordChange({
      username,
      oldPassword: '',
      newPassword: ''
    });
  };

  const handlePasswordSubmit = () => {
    const { username, oldPassword, newPassword } = passwordChange;
    if (authService.changePassword(username, oldPassword, newPassword)) {
      setMessage('密码修改成功');
      setPasswordChange({
        username: '',
        oldPassword: '',
        newPassword: ''
      });
    } else {
      setMessage('密码修改失败：原密码错误');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        用户管理
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        当前登录用户: {authService.getCurrentUser()?.username || '未登录'} | 
        显示用户数: {users.length}
      </Alert>
      
      {message && (
        <Alert severity={message.includes('成功') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>用户名</TableCell>
              <TableCell>角色</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>
                  {user.username === 'cxy14' ? (
                    '作者'
                  ) : (
                    <Select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.username, e.target.value)}
                      disabled={authService.getCurrentUser().username !== 'cxy14'}
                      sx={{ minWidth: 120 }}
                    >
                      <MenuItem value="student">成员</MenuItem>
                      <MenuItem value="admin">管理员</MenuItem>
                    </Select>
                  )}
                </TableCell>
                <TableCell>
                  {user.status === 'banned' ? '已封禁' : 
                   user.status === 'deleted' ? '已注销' : '正常'}
                </TableCell>
                <TableCell>
                  {authService.getCurrentUser()?.username === user.username && (
                    <>
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handlePasswordChange(user.username)}
                        sx={{ mr: 1 }}
                      >
                        修改密码
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small"
                        color="error"
                        onClick={() => {
                          if (window.confirm('确定要注销账号吗？此操作不可撤销！')) {
                            authService.deleteAccount(user.username);
                            window.location.reload();
                          }
                        }}
                      >
                        注销账号
                      </Button>
                    </>
                  )}
                  {authService.isAuthor() && user.username !== authService.getCurrentUser()?.username && user.username !== 'cxy14' && (
                    <>
                      {user.status !== 'banned' ? (
                        <Button 
                          variant="outlined" 
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm(`确定要封禁用户 ${user.username} 吗？`)) {
                              authService.banUser(user.username);
                              window.location.reload();
                            }
                          }}
                          sx={{ mr: 1 }}
                        >
                          封禁
                        </Button>
                      ) : (
                        <>
                          <Button 
                            variant="outlined" 
                            size="small"
                            color="success"
                            onClick={() => {
                              authService.restoreUser(user.username);
                              window.location.reload();
                            }}
                            sx={{ mr: 1 }}
                          >
                            恢复
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            color="error"
                            onClick={() => {
                              if (window.confirm(`确定要永久删除用户 ${user.username} 吗？此操作不可撤销！`)) {
                                authService.permanentlyDeleteUser(user.username);
                                window.location.reload();
                              }
                            }}
                          >
                            彻底删除
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {passwordChange.username && 
       authService.getCurrentUser().username === passwordChange.username && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            修改 {passwordChange.username} 的密码
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="原密码"
              type="password"
              value={passwordChange.oldPassword}
              onChange={(e) => setPasswordChange({
                ...passwordChange,
                oldPassword: e.target.value
              })}
            />
            <TextField
              label="新密码"
              type="password"
              value={passwordChange.newPassword}
              onChange={(e) => setPasswordChange({
                ...passwordChange,
                newPassword: e.target.value
              })}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                variant="outlined"
                onClick={() => setPasswordChange({
                  username: '',
                  oldPassword: '',
                  newPassword: ''
                })}
              >
                取消
              </Button>
              <Button 
                variant="contained"
                onClick={handlePasswordSubmit}
              >
                确认修改
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

    </Container>
  );
};

export default UserManagement;
