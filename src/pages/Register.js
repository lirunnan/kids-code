import React, { useState } from 'react';
import { 
  Container,
  Typography,
  TextField,
  Button,
  Alert,
  Box,
  Paper
} from '@mui/material';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [user, setUser] = useState({
    username: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = () => {
    const result = authService.register(
      user.username,
      user.password
    );
    
    if (result.success) {
      setMessage('注册成功，即将跳转到登录页面');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setMessage(result.message);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          用户注册
        </Typography>
        
        {message && (
          <Alert severity={message.includes('成功') ? 'success' : 'error'} sx={{ mb: 3 }}>
            {message}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="用户名"
            value={user.username}
            onChange={(e) => setUser({...user, username: e.target.value})}
            fullWidth
          />
          <TextField
            label="密码"
            type="password"
            value={user.password}
            onChange={(e) => setUser({...user, password: e.target.value})}
            fullWidth
          />
          <Button 
            variant="contained" 
            size="large"
            onClick={handleRegister}
            fullWidth
            sx={{ mt: 2 }}
          >
            注册
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
