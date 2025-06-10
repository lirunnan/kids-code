import React, { useState, useEffect } from 'react';
import { Container, Typography, Box } from '@mui/material';
import SlideManager from '../components/SlideManager';
import { authService } from '../services/authService';

const Learn = () => {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 检查当前用户是否为管理员
    setIsAdmin(authService.hasRole('admin'));
    
    // 监听用户状态变化
    const handleUserChange = () => {
      setIsAdmin(authService.hasRole('admin'));
    };
    
    // 添加事件监听器，当用户登录/登出时更新状态
    window.addEventListener('userChange', handleUserChange);
    return () => {
      window.removeEventListener('userChange', handleUserChange);
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        学习区
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          学习内容
        </Typography>
        
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            课程PPT资料
          </Typography>
          <SlideManager 
            courseId="learn-ppt" 
            isAdmin={isAdmin}
            onSave={(slides) => console.log('Slides saved:', slides)}
            showListOnly={false}
          />
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            其他学习资料
          </Typography>
          <Typography variant="body1">
            这里将展示其他学习内容
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Learn;