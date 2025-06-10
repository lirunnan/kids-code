import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import SchoolIcon from '@mui/icons-material/School';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';


const Navbar = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };
  const navItems = [
    { text: '首页', icon: <CodeIcon />, path: '/' },
    { text: '学习', icon: <SchoolIcon />, path: '/learn' },
    { text: '编程乐园', icon: <PlayArrowIcon />, path: '/playground' },
    { text: '社区', icon: <PeopleIcon />, path: '/community' },
  ];

  // 如果是管理员，添加用户管理入口
  if (currentUser && currentUser.username === 'cxy14') {
    navItems.push({ 
      text: '用户管理', 
      icon: <PeopleIcon />, 
      path: '/admin/users' 
    });
  }

  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Kids Coding Hub
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {currentUser && (
            <Tooltip title="登出">
              <IconButton 
                color="inherit" 
                onClick={handleLogout}
                sx={{ ml: 1 }}
              >
                <ExitToAppIcon />
              </IconButton>
            </Tooltip>
          )}
          {navItems.map((item) => (
            <Button
              key={item.text}
              color="inherit"
              component={RouterLink}
              to={item.path}
              startIcon={item.icon}
            >
              {item.text}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 