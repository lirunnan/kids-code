import React, { useState } from 'react';
import SlideManager from '../components/SlideManager';
import {
  Container,
  Typography,
  Box,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MobileStepper
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Check as CheckIcon,
  Code as CodeIcon,
  Quiz as QuizIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Slideshow as SlideshowIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [activeStep, setActiveStep] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [code, setCode] = useState('// 在这里编写你的代码\n');
  const [slideIndex, setSlideIndex] = useState(0);
  const [output, setOutput] = useState('');

  // 模拟课程数据
  const courseData = {
    id: courseId,
    title: 'C++入门第一课',
    description: '认识编程世界，学习第一个C++程序',
    steps: [
      {
        title: '课程PPT讲解',
        content: '让我们通过PPT来了解C++编程的基础概念',
        type: 'slides',
        slides: [
          {
            title: '什么是C++？',
            content: [
              '• C++是一种强大的编程语言',
              '• 它既可以进行底层编程，也可以进行面向对象编程',
              '• 被广泛应用于游戏开发、系统软件等领域'
            ],
            image: 'https://source.unsplash.com/random/800x600/?programming'
          },
          {
            title: 'C++的特点',
            content: [
              '• 高效性能',
              '• 灵活性强',
              '• 兼容C语言',
              '• 支持面向对象'
            ],
            image: 'https://source.unsplash.com/random/800x600/?coding'
          },
          {
            title: '为什么学习C++？',
            content: [
              '• 就业机会多',
              '• 打好编程基础',
              '• 提高逻辑思维',
              '• 开发大型应用'
            ],
            image: 'https://source.unsplash.com/random/800x600/?computer'
          }
        ]
      },
      {
        title: '什么是编程？',
        content: `编程就是告诉计算机要做什么。就像你给朋友写一封信，告诉他要做什么一样。
        
        在编程中，我们使用特殊的语言（比如C++）来和计算机交流。计算机很聪明，但它需要非常明确的指示。
        
        让我们来看一个简单的例子：`,
        type: 'text',
        code: `#include <iostream>
using namespace std;

int main() {
    cout << "你好，世界！" << endl;
    return 0;
}`
      },
      {
        title: '第一个程序',
        content: '现在让我们来写第一个程序！',
        type: 'practice',
        task: '编写一个程序，输出"我爱编程！"',
        solution: `#include <iostream>
using namespace std;

int main() {
    cout << "我爱编程！" << endl;
    return 0;
}`
      },
      {
        title: '小测验',
        content: '让我们来测试一下你学到了什么！',
        type: 'quiz',
        questions: [
          {
            question: 'C++程序必须包含哪个函数？',
            options: ['main()', 'start()', 'begin()', 'init()'],
            correct: 0
          },
          {
            question: 'cout 是用来做什么的？',
            options: ['输入数据', '输出数据', '计算数据', '存储数据'],
            correct: 1
          }
        ]
      }
    ]
  };

  const handleNext = () => {
    if (activeStep === courseData.steps.length - 1) {
      // 课程完成
      navigate('/learn');
    } else {
      setActiveStep((prevStep) => prevStep + 1);
      setSlideIndex(0); // 重置幻灯片索引
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleQuizSubmit = () => {
    setShowResult(true);
  };

  const handleCodeRun = () => {
    // 这里应该调用后端API来运行代码
    setOutput('你好，世界！\n程序运行成功！');
  };

  const renderStepContent = (step) => {
    switch (step.type) {
      case 'slides':
        const currentSlide = step.slides[slideIndex];
        return (
          <Box>
            <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
              {currentSlide.title}
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: 4,
              mb: 4 
            }}>
              <Box sx={{ flex: 1 }}>
                <img
                  src={currentSlide.image}
                  alt={currentSlide.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <List>
                  {currentSlide.content.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <SlideshowIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>

            <MobileStepper
              variant="dots"
              steps={step.slides.length}
              position="static"
              activeStep={slideIndex}
              sx={{ flexGrow: 1, justifyContent: 'center' }}
              nextButton={
                <Button
                  size="small"
                  onClick={() => setSlideIndex(slideIndex + 1)}
                  disabled={slideIndex === step.slides.length - 1}
                >
                  下一页
                  <ArrowForwardIcon />
                </Button>
              }
              backButton={
                <Button
                  size="small"
                  onClick={() => setSlideIndex(slideIndex - 1)}
                  disabled={slideIndex === 0}
                >
                  <ArrowBackIcon />
                  上一页
                </Button>
              }
            />
          </Box>
        );

      case 'text':
        return (
          <Box>
            <Typography variant="body1" paragraph>
              {step.content}
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Editor
                height="200px"
                language="cpp"
                value={step.code}
                options={{
                  readOnly: true,
                  minimap: { enabled: false }
                }}
              />
            </Paper>
          </Box>
        );

      case 'practice':
        return (
          <Box>
            <Typography variant="body1" paragraph>
              {step.content}
            </Typography>
            <Typography variant="h6" gutterBottom>
              练习任务：{step.task}
            </Typography>
            <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
              <Editor
                height="200px"
                language="cpp"
                value={code}
                onChange={(value) => setCode(value)}
                options={{
                  minimap: { enabled: false }
                }}
              />
            </Paper>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayIcon />}
                onClick={handleCodeRun}
              >
                运行代码
              </Button>
            </Box>
            {output && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: '#e8f5e9' }}>
                <Typography variant="body1" component="pre">
                  {output}
                </Typography>
              </Paper>
            )}
          </Box>
        );

      case 'quiz':
        return (
          <Box>
            <Typography variant="body1" paragraph>
              {step.content}
            </Typography>
            <List>
              {step.questions.map((q, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">
                        {index + 1}. {q.question}
                      </FormLabel>
                      <RadioGroup
                        value={quizAnswers[index] || ''}
                        onChange={(e) => {
                          setQuizAnswers({
                            ...quizAnswers,
                            [index]: e.target.value
                          });
                        }}
                      >
                        {q.options.map((option, optIndex) => (
                          <FormControlLabel
                            key={optIndex}
                            value={optIndex.toString()}
                            control={<Radio />}
                            label={option}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </ListItem>
                  {index < step.questions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleQuizSubmit}
                disabled={Object.keys(quizAnswers).length !== step.questions.length}
              >
                提交答案
              </Button>
            </Box>
            {showResult && (
              <Box sx={{ mt: 2 }}>
                <Alert severity="success">
                  恭喜你完成了测验！继续学习下一课吧！
                </Alert>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/learn')}
          >
            返回课程列表
          </Button>
          <SlideManager 
            courseId={courseId} 
            isAdmin={false}
            onSave={(slides) => {
              // 这里可以处理保存幻灯片的逻辑
              console.log('保存课程幻灯片:', slides);
            }} 
          />
        </Box>
        <Typography variant="h3" component="h1" gutterBottom>
          {courseData.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          {courseData.description}
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {courseData.steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        {renderStepContent(courseData.steps[activeStep])}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          上一步
        </Button>
        <Button
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          onClick={handleNext}
          disabled={activeStep === courseData.steps.length - 1 && !showResult}
        >
          {activeStep === courseData.steps.length - 1 ? '完成课程' : '下一步'}
        </Button>
      </Box>
    </Container>
  );
};

export default CourseDetail;