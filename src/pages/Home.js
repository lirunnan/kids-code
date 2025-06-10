import React from 'react';
import { Container, Typography, Grid, Card, CardContent, CardMedia, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: '趣味编程学习',
      description: '通过有趣的游戏和挑战学习C++编程基础',
      image: '/images/20250601132254.png',
      overlayText: 'Fun Learning',
      path: '/learn'
    },
    {
      title: '在线编程乐园',
      description: '在安全的在线环境中练习编程，即时看到运行结果',
      image: '/images/20250601133757.png',
      overlayText: 'Coding',
      path: '/playground'
    },
    {
      title: '编程社区',
      description: '和其他小朋友一起交流学习，分享作品',
      image: '/images/20250601135122.png',
      overlayText: 'Coding Community',
      path: '/community'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          欢迎来到编程世界！
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          让我们一起开始有趣的编程之旅吧！
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {features.map((feature) => (
          <Grid item key={feature.title} xs={12} sm={6} md={4}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: '0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 3
                }
              }}
            >
              <Box sx={{ 
                position: 'relative',
                height: 140,
                aspectRatio: '3/2',
                backgroundColor: '#3d5a80'
              }}>
                <CardMedia
                  component="img"
                  sx={{
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  image={feature.image}
                  alt={feature.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/fallback-image.jpg';
                    e.target.style.objectFit = 'contain';
                    e.target.style.backgroundColor = '#f5f5f5';
                  }}
                />
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(61, 90, 128, 0.7)'
                }}>
                  <Typography 
                    variant="h3" 
                    sx={{
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '2.5rem'
                    }}
                  >
                    {feature.overlayText}
                  </Typography>
                </Box>
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography gutterBottom variant="h5" component="h2">
                  {feature.title}
                </Typography>
                <Typography>
                  {feature.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth
                  onClick={() => navigate(feature.path)}
                >
                  开始探索
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
        </Grid>
    </Container>
  );
};

export default Home; 