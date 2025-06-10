import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  Paper,
  Grid,
  Alert,
  Tab,
  Tabs,
  InputAdornment,
  Chip,
  Avatar,
  Badge
} from '@mui/material';
import { authService } from '../services/authService';
import { getFileUrl, uploadFile } from '../api/fileApi';
import PptViewer from './PptViewer';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Upload as UploadIcon,
  Save as SaveIcon,
  Slideshow as SlideshowIcon,
  Person as PersonIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

const SlideManager = ({ courseId, onSave, isAdmin = false, showListOnly = false }) => {
  const hasPermission = isAdmin || (authService.getCurrentUser()?.isAdmin === true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [currentPpt, setCurrentPpt] = useState(null);
  console.log('SlideManager rendered with isAdmin:', isAdmin);
  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState({
    title: '',
    content: [''],
    image: ''
  });
  const [editIndex, setEditIndex] = useState(-1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [uploadedPpt, setUploadedPpt] = useState(null);
  const [pptTitle, setPptTitle] = useState('');
  const [pptSubmissions, setPptSubmissions] = useState([]);
  const [approvedPpts, setApprovedPpts] = useState([]);
  const [hasAccess, setHasAccess] = useState(true);
  const fileInputRef = useRef(null);
  const [reviewerDialog, setReviewerDialog] = useState({
    open: false,
    type: '', // 'add' or 'remove'
    title: '',
    content: '',
    defaultValue: '',
    onConfirm: () => {}
  });
  const [historyDialog, setHistoryDialog] = useState({
    open: false,
    history: []
  });
  const [inputValue, setInputValue] = useState('');
  const [reviewers, setReviewers] = useState(() => {
    const saved = localStorage.getItem('reviewers');
    return saved ? JSON.parse(saved) : [
      { 
        name: '用户', 
        isAdmin: true,
        onDelete: undefined // 管理员不可删除
      },
      { 
        name: '李四', 
        isAdmin: false,
        onDelete: (e) => {
          e.stopPropagation();
          const updatedReviewers = reviewers.filter(r => r.name !== '李四');
          setReviewers(updatedReviewers);
          // 同时清除本地存储中的李四数据
          localStorage.removeItem('李四_data');
          localStorage.setItem('reviewers', JSON.stringify(updatedReviewers));
          setSuccess('已永久删除成员: 李四');
          // 强制刷新组件状态
          setReviewers(prev => [...prev]);
        }
      }
    ];
  });
  
  // 初始化管理员数据
  useEffect(() => {
    const saved = localStorage.getItem('reviewers');
    const currentUser = authService.getCurrentUser();
    
    if (!saved) {
      const defaultReviewers = [
        { 
          name: currentUser?.name || '审核员',
          onDelete: undefined
        }
      ];
      setReviewers(defaultReviewers);
      localStorage.setItem('reviewers', JSON.stringify(defaultReviewers));
    } else {
      // 确保当前用户始终作为管理员存在
      const existingReviewers = JSON.parse(saved);
      const currentUserExists = existingReviewers.some(
        r => r.name.includes(currentUser?.name || '管理员')
      );
      
      if (!currentUserExists) {
        const updatedReviewers = [
          ...existingReviewers,
          {
            name: currentUser?.name || '审核员',
            onDelete: undefined
          }
        ];
        setReviewers(updatedReviewers);
        localStorage.setItem('reviewers', JSON.stringify(updatedReviewers));
      }
    }
  }, []);

  // 获取所有管理员
  const allReviewers = reviewers;

  // 合并权限判断
  const checkPermission = (user) => {
    return hasPermission || user?.isAdmin;
  };

  // 初始化PPT申请数据
  useEffect(() => {
    const savedSubmissions = JSON.parse(localStorage.getItem('pptSubmissions') || '[]');
    const savedApproved = JSON.parse(localStorage.getItem('approvedPpts') || '[]');
    console.log('从localStorage加载approvedPpts:', savedApproved);
    
    if (hasPermission) {
      setPptSubmissions(savedSubmissions);
      setApprovedPpts(savedApproved.map(ppt => ({
        ...ppt,
        pptFile: ppt.pptFile || ppt.filePath || ppt.url // 兼容多种字段名
      })));
    } else {
      // 所有成员可以看到所有已批准的PPT
      setApprovedPpts(savedApproved.map(ppt => ({
        ...ppt,
        pptFile: ppt.pptFile || ppt.filePath || ppt.url // 兼容多种字段名
      })));
    }
  }, [isAdmin]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentSlide({ title: '', content: [''], image: '' });
    setEditIndex(-1);
    setError('');
    setSuccess('');
    setTabValue(0);
    setUploadedPpt(null);
    setPptTitle('');
  };

  const handleTabChange = (event, newValue) => {
    // 成员端强制锁定在"上传PPT文件"标签页
    const memberTab = hasPermission ? newValue : 1;
    setTabValue(memberTab);
    setError('');
    setSuccess('');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 更严格的文件验证
      const isValidPpt = (
        (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' && 
         file.name.endsWith('.pptx')) ||
        (file.type === 'application/vnd.ms-powerpoint' && 
         file.name.endsWith('.ppt')) ||
        (/\.pptx?$/i.test(file.name) && 
         file.size > 0 && 
         file.size < 50 * 1024 * 1024) // 限制50MB
      );
      
      if (isValidPpt) {
        setUploadedPpt(file);
        setPptTitle(file.name.replace(/\.[^/.]+$/, "")); // 更安全的文件名处理
        setError('');
      } else {
        setUploadedPpt(null);
        setError(`请上传有效的PPT文件 (.ppt 或 .pptx)，且大小不超过50MB`);
      }
    }
  };

  const handleUploadPpt = async () => {
    // 锁定当前tabValue
    const originalTab = tabValue;
    let shouldResetTab = false;
    
    if (!uploadedPpt) {
      setError('请选择PPT文件');
      return;
    }
    
    // 确保在函数结束时恢复原始tabValue
    const resetTab = () => {
      if (shouldResetTab) {
        setTabValue(originalTab);
      }
    };

    if (!pptTitle.trim()) {
      setError('请输入PPT标题');
      return;
    }

    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'cxy14' ;
    
    try {
      setSuccess('正在上传文件...');
      // 添加上传前的文件信息
      console.log('上传文件信息:', {
        name: uploadedPpt.name,
        size: uploadedPpt.size,
        type: uploadedPpt.type,
        lastModified: uploadedPpt.lastModified
      });
      
      const uploadResponse = await uploadFile(uploadedPpt);
      console.log('完整上传响应:', {
        status: 'success',
        data: uploadResponse,
        fileInfo: {
          receivedSize: uploadResponse.size, // 假设API返回文件大小
          expectedSize: uploadedPpt.size
        }
      });
      
      // 严格验证API响应
      if (!uploadResponse || typeof uploadResponse !== 'object') {
        throw new Error(`无效的上传响应: ${typeof uploadResponse}`);
      }
      const filePath = uploadResponse.filePath || uploadResponse.path; // 兼容两种字段名
      if (!filePath) {
        throw new Error(`上传响应缺少文件路径字段，实际收到: ${Object.keys(uploadResponse).join(', ')}`);
      }
      if (typeof filePath !== 'string' || filePath.trim() === '') {
        throw new Error(`无效的文件路径格式: "${filePath}"`);
      }
      
      const newSubmission = {
        id: Date.now(),
        name: isAdmin ? '管理员' : (currentUser?.name || '匿名用户'),
        avatar: isAdmin ? '' : (currentUser?.avatar || ''),
        time: new Date().toLocaleString(),
        pptTitle: pptTitle,
        pptFile: filePath, // 主路径字段
        filePath: filePath, // 兼容字段1
        url: filePath,     // 兼容字段2
        path: filePath,    // 兼容字段3
        status: isAdmin ? 'approved' : 'pending'
      };
      console.log('新建的PPT对象:', newSubmission);

      if (isAdmin) {
        // 管理员上传直接加入已批准列表
        const newApproved = {
          ...newSubmission,
          pptFile: filePath,
          filePath: filePath,
          url: filePath,
          path: filePath,
          approvedTime: new Date().toLocaleString()
        };
        console.log('新建的已批准PPT:', newApproved);
        const updatedApproved = [...approvedPpts, newApproved];
        setApprovedPpts(updatedApproved);
        
        // 严格验证localStorage写入
        try {
          localStorage.setItem('approvedPpts', JSON.stringify(updatedApproved));
          const savedData = localStorage.getItem('approvedPpts');
          if (!savedData) {
            throw new Error('approvedPpts写入localStorage失败');
          }
          console.log('approvedPpts写入验证:', JSON.parse(savedData));
        } catch (e) {
          console.error('localStorage写入错误:', e);
          throw e;
        }
        
        console.log('Upload response:', uploadResponse, 'Stored ppt:', newApproved);
      
      // 安全获取下载路径
      const getDownloadPath = () => {
        try {
          if (!uploadResponse || typeof uploadResponse !== 'object') {
            throw new Error('上传响应无效');
          }
          
          const path = (uploadResponse.filePath || uploadResponse.path)?.toString()?.trim();
          if (!path) throw new Error('文件路径不存在');

          // 处理不同形式的路径
          let downloadPath;
          if (path.startsWith('http')) {
            // 已经是完整URL
            downloadPath = path;
          } else if (path.startsWith('/')) {
            // 绝对路径
            downloadPath = `${window.location.origin}${path}`;
          } else {
            // 相对路径
            downloadPath = `${window.location.origin}/api/download?file=${encodeURIComponent(path)}`;
          }
          
          console.log('生成的下载路径:', downloadPath);
          return downloadPath;
        } catch (error) {
          console.error('生成下载路径失败:', error);
          throw error;
        }
      };

      let downloadPath;
      try {
        downloadPath = getDownloadPath();
        console.log('生成的下载路径:', downloadPath);
      } catch (error) {
        console.error('生成下载路径失败:', error);
        throw new Error(`无法生成下载路径: ${error.message}`);
      }
      
      // 将下载路径保存到localStorage
      const downloadHistory = JSON.parse(localStorage.getItem('pptDownloadHistory') || '[]');
      const newHistoryItem = {
        id: Date.now(),
        title: pptTitle,
        path: downloadPath,
        timestamp: new Date().toISOString()
      };
      
      // 严格验证localStorage写入
      try {
        const newHistory = [...downloadHistory, newHistoryItem];
        localStorage.setItem('pptDownloadHistory', JSON.stringify(newHistory));
        const savedHistory = localStorage.getItem('pptDownloadHistory');
        if (!savedHistory) {
          throw new Error('pptDownloadHistory写入localStorage失败');
        }
        console.log('pptDownloadHistory写入验证:', JSON.parse(savedHistory));
      } catch (e) {
        console.error('localStorage写入错误:', e);
        throw e;
      }
      
      setSuccess(`PPT "${pptTitle}" 已成功上传，点击"查看"按钮可下载`);
    } else {
      // 普通用户进入审核队列
      const updatedSubmissions = [...pptSubmissions, newSubmission];
      setPptSubmissions(updatedSubmissions);
      localStorage.setItem('pptSubmissions', JSON.stringify(updatedSubmissions));
      const downloadPath = `${process.env.REACT_APP_API_BASE || window.location.origin}${newSubmission.pptFile}`;
      setSuccess(`PPT "${pptTitle}" 已提交申请，等待管理员审批。下载路径: ${downloadPath}`);
    }
    } catch (error) {
      console.error('上传失败:', error);
      setError(`上传失败: ${error.message}`);
    } finally {
      // 重置上传状态
      setUploadedPpt(null);
      setPptTitle('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    // 移除handleClose调用，保持对话框打开以便继续上传
  };

  const handleAddSlide = () => {
    if (!currentSlide.title.trim()) {
      setError('幻灯片标题不能为空');
      return;
    }

    if (!currentSlide.image.trim()) {
      setError('请提供幻灯片图片URL');
      return;
    }

    if (currentSlide.content.some(item => !item.trim())) {
      setError('幻灯片内容不能为空');
      return;
    }

    if (editIndex >= 0) {
      // 编辑现有幻灯片
      const newSlides = [...slides];
      newSlides[editIndex] = { ...currentSlide };
      setSlides(newSlides);
      setSuccess('幻灯片已更新');
    } else {
      // 添加新幻灯片
      setSlides([...slides, { ...currentSlide }]);
      setSuccess('新幻灯片已添加');
    }

    // 重置表单
    setCurrentSlide({ title: '', content: [''], image: '' });
    setEditIndex(-1);
    setError('');
  };

  const handleEditSlide = (index) => {
    setCurrentSlide({ ...slides[index] });
    setEditIndex(index);
    setError('');
    setSuccess('');
  };

  const handleDeleteSlide = (index) => {
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    setSlides(newSlides);
    setSuccess('幻灯片已删除');
  };

  const handleAddContentPoint = () => {
    setCurrentSlide({
      ...currentSlide,
      content: [...currentSlide.content, '']
    });
  };

  const handleContentChange = (index, value) => {
    const newContent = [...currentSlide.content];
    newContent[index] = value;
    setCurrentSlide({
      ...currentSlide,
      content: newContent
    });
  };

  const handleDeleteContentPoint = (index) => {
    if (currentSlide.content.length <= 1) {
      setError('幻灯片至少需要一个内容点');
      return;
    }
    
    const newContent = [...currentSlide.content];
    newContent.splice(index, 1);
    setCurrentSlide({
      ...currentSlide,
      content: newContent
    });
  };

  const handleSaveAllSlides = () => {
    if (slides.length === 0) {
      setError('请至少添加一个幻灯片');
      return;
    }
    
    // 这里应该调用API保存幻灯片到后端
    if (onSave) {
      onSave(slides);
    }
    
    setSuccess('所有幻灯片已保存');
    setTimeout(() => {
      handleClose();
    }, 1500);
  }

  return (
    <>
      {/* 调试信息已隐藏 */}
      {!showListOnly && (
        <>
          {isAdmin ? (
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button 
                variant="contained" 
                startIcon={<SlideshowIcon />} 
                onClick={handleOpen}
                color="secondary"
              >
                管理课程PPT
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />} 
                onClick={() => {
                  const history = JSON.parse(localStorage.getItem('pptDownloadHistory') || '[]');
                  setHistoryDialog({
                    open: true,
                    history: history
                  });
                }}
              >
                查看下载历史
              </Button>
            </Box>
          ) : (
            <Button 
              variant="contained" 
              startIcon={<SlideshowIcon />} 
              onClick={handleOpen}
              color="primary"
              sx={{ mb: 2 }}
            >
              创建/上传PPT
            </Button>
          )}
        </>
      )}

      {(approvedPpts.length > 0 || isAdmin) ? (
        <Box sx={{ mt: showListOnly ? 0 : 3 }}>
          {!showListOnly && (
            <Typography variant="h6" gutterBottom>
              已批准的PPT
            </Typography>
          )}
          <List>
            {approvedPpts.map((ppt) => (
              <ListItem key={ppt.id}>
                <ListItemText
                  primary={ppt.pptTitle}
                  secondary={
                    <Box>
                      <Typography variant="body2">
                        {`上传者: ${ppt.name} | 批准时间: ${ppt.approvedTime}`}
                      </Typography>
                      {/* <Typography 
                        variant="body2" 
                        color="primary"
                        sx={{ 
                          textDecoration: 'underline',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(ppt.pptTitle);
                          setSuccess('PPT名称已复制');
                        }}
                      >
                        {ppt.pptTitle}
                      </Typography> */}
                    </Box>
                  }
                />
                <Button 
                  variant="outlined" 
                  startIcon={<SlideshowIcon />}
                  onClick={async () => {
                    try {
                      setSuccess(`正在准备下载: ${ppt.pptTitle}`);
                      
                      // 获取并验证存储的下载路径
                      const downloadPath = ppt.pptFile || ppt.filePath || ppt.url;
                      console.log('原始存储路径:', downloadPath, '完整PPT对象:', ppt);
                      if (!downloadPath) {
                        throw new Error(`找不到文件下载路径，检查的字段: pptFile=${ppt.pptFile}, filePath=${ppt.filePath}, url=${ppt.url}`);
                      }
                      if (typeof downloadPath !== 'string' || downloadPath.trim() === '') {
                        throw new Error(`无效的文件路径格式: "${downloadPath}"`);
                      }

                      // 处理不同路径格式
                      let downloadUrl;
                      // 标准化路径格式
                      const normalizedPath = downloadPath.trim();
                      console.log('标准化后的路径:', normalizedPath);
                      
                      if (normalizedPath.startsWith('http')) {
                        downloadUrl = normalizedPath;
                      } else if (normalizedPath.startsWith('/')) {
                        downloadUrl = `${window.location.origin}${normalizedPath}`;
                      } else {
                        downloadUrl = `${window.location.origin}/api/download?file=${encodeURIComponent(normalizedPath)}`;
                      }
                      console.log('生成的下载URL:', downloadUrl);

                      console.log('开始下载文件，URL:', downloadUrl);
                      const response = await fetch(downloadUrl);
                      if (!response.ok) {
                        throw new Error(`文件不可用: ${response.status}`);
                      }

                      // 添加响应头日志
                      console.log('下载响应头:', {
                        status: response.status,
                        size: response.headers.get('content-length'),
                        type: response.headers.get('content-type')
                      });

                      // 确保返回正确的Content-Type
                      if (!response.headers.get('content-type')?.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
                        throw new Error('服务器返回了错误的Content-Type');
                      }

                      const blob = await response.blob();
                      
                      if (!blob || blob.size === 0) {
                        throw new Error('获取的文件为空');
                      }

                      const filename = downloadPath.split('/').pop() || 'presentation.pptx';
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(url);
                      
                      setSuccess(`下载完成: ${ppt.pptTitle}`);
                    } catch (error) {
                      console.error('下载失败:', error);
                      setError(`下载失败: ${error.message}. 请检查文件是否存在或联系管理员`);
                    }
                  }}
                  sx={{ mr: 1 }}
                >
                  查看
                </Button>
                {(isAdmin || ppt.name === 'cxy14' || ppt.name === (JSON.parse(localStorage.getItem('currentUser'))?.name || '')) && (
                  <Button
                    variant="outlined"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => {
                      const updatedApproved = approvedPpts.filter(p => p.id !== ppt.id);
                      setApprovedPpts(updatedApproved);
                      localStorage.setItem('approvedPpts', JSON.stringify(updatedApproved));
                      setSuccess(`PPT "${ppt.pptTitle}" 已删除`);
                    }}
                  >
                    删除
                  </Button >
                )}
              </ListItem>
            ))}
          </List>
        </Box>
      ) : (
        !showListOnly && (
          <Alert severity="info" sx={{ mt: 3 }}>
            暂无已批准的PPT
          </Alert>
        )
      )}

      <Dialog 
        open={open} 
        onClose={handleClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">课程幻灯片管理</Typography>
            {tabValue === 0 && (
              <Button 
                variant="contained" 
                startIcon={<SaveIcon />}
                color="primary"
                onClick={handleSaveAllSlides}
              >
                保存所有幻灯片
              </Button>
            )}
            {tabValue === 1 && (
              <Button 
                variant="contained" 
                startIcon={<UploadIcon />}
                color="primary"
                onClick={handleUploadPpt}
                disabled={!uploadedPpt}
              >
                上传PPT
              </Button>
            )}
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="创建幻灯片" />
            <Tab label="上传PPT文件" />
            {hasPermission && <Tab label="审核管理" />}
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
          )}

          {tabValue === 2 && hasPermission ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                访问权限管理
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                您可以管理成员对PPT的访问权限
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  PPT审批管理
                </Typography>
                
                {(pptSubmissions.length > 0 || isAdmin) ? (
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1">
                        待审批申请 ({isAdmin ? '全部' : pptSubmissions.length})
                      </Typography>
                      <Chip 
                        label="需审批" 
                        color="warning" 
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                    <List>
                      {pptSubmissions.map((submission) => (
                        <ListItem
                          key={submission.id}
                          secondaryAction={
                            <Box>
                              <Button
                                startIcon={<CheckIcon />}
                                onClick={() => {
                                  const updatedSubmissions = pptSubmissions.filter(s => s.id !== submission.id);
                                  setPptSubmissions(updatedSubmissions);
                                  localStorage.setItem('pptSubmissions', JSON.stringify(updatedSubmissions));
                                  
                                  const newApproved = {
                                    ...submission,
                                    id: Date.now(),
                                    approvedTime: new Date().toLocaleString()
                                  };
                                  const updatedApproved = [...approvedPpts, newApproved];
                                  setApprovedPpts(updatedApproved);
                                  localStorage.setItem('approvedPpts', JSON.stringify(updatedApproved));
                                  setSuccess(`已批准 ${submission.name} 的PPT申请: ${submission.pptTitle}`);
                                }}
                                color="success"
                                size="small"
                                sx={{ mr: 1 }}
                              >
                                批准
                              </Button>
                              <Button
                                startIcon={<CloseIcon />}
                                onClick={() => {
                                  const updatedSubmissions = pptSubmissions.filter(s => s.id !== submission.id);
                                  setPptSubmissions(updatedSubmissions);
                                  localStorage.setItem('pptSubmissions', JSON.stringify(updatedSubmissions));
                                  setSuccess(`已拒绝 ${submission.name} 的PPT申请: ${submission.pptTitle}`);
                                }}
                                color="error"
                                size="small"
                              >
                                拒绝
                              </Button>
                            </Box>
                          }
                        >
                          <Button 
                            variant="outlined" 
                            size="small"
                            sx={{ mr: 2 }}
                            onClick={async () => {
                              try {
                                setSuccess(`正在加载: ${submission.pptTitle}...`);
                                
                                // 使用新的文件API处理路径
                                const pptPath = submission.pptFile;
                                if (pptPath.startsWith('http')) {
                                  // 在线PPT使用Office Viewer
                                  setCurrentPpt({
                                    ...submission,
                                    pptFile: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(pptPath)}`
                                  });
                                } else {
                                  // 本地文件使用API端点
                                  setCurrentPpt({
                                    ...submission,
                                    pptFile: `${encodeURIComponent(pptPath)}`
                                  });
                                }
                                setPreviewOpen(true);
                              } catch (error) {
                                setError(`文件加载失败: ${error.message}. 请检查文件是否存在或联系管理员`);
                              }
                            }}
                          >
                            预览
                          </Button>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                  {submission.name.charAt(0)}
                                </Avatar>
                                <Typography>
                                  {submission.pptTitle} - {submission.name}
                                </Typography>
                              </Box>
                            }
                            secondary={`提交于 ${submission.time}`}
                            sx={{ ml: 1 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Alert severity="info">
                    当前没有待审批的PPT申请
                  </Alert>
                )}
              </Box>
            </Box>
          ) : tabValue === 0 ? (
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  {editIndex >= 0 ? '编辑幻灯片' : '添加新幻灯片'}
                </Typography>
                
                <TextField
                  label="幻灯片标题"
                  fullWidth
                  margin="normal"
                  value={currentSlide.title}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, title: e.target.value })}
                />
                
                <TextField
                  label="图片URL"
                  fullWidth
                  margin="normal"
                  value={currentSlide.image}
                  onChange={(e) => setCurrentSlide({ ...currentSlide, image: e.target.value })}
                  helperText="输入有效的图片URL"
                />
                
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                  幻灯片内容点
                </Typography>
                
                {currentSlide.content.map((point, index) => (
                  <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={point}
                      onChange={(e) => handleContentChange(index, e.target.value)}
                      placeholder={`内容点 ${index + 1}`}
                    />
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteContentPoint(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={handleAddContentPoint}
                  sx={{ mt: 1 }}
                >
                  添加内容点
                </Button>
                
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleAddSlide}
                    fullWidth
                  >
                    {editIndex >= 0 ? '更新幻灯片' : '添加幻灯片'}
                  </Button>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, height: '100%', maxHeight: '500px', overflow: 'auto' }}>
                <Typography variant="h6" gutterBottom>
                  幻灯片列表 ({slides.length})
                </Typography>
                
                {slides.length === 0 ? (
                  <Alert severity="info">
                    尚未添加幻灯片，请在左侧添加新幻灯片
                  </Alert>
                ) : (
                  <List>
                    {slides.map((slide, index) => (
                      <React.Fragment key={index}>
                        <ListItem
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                onClick={() => handleEditSlide(index)}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                onClick={() => handleDeleteSlide(index)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={`${index + 1}. ${slide.title}`}
                            secondary={`${slide.content.length} 个内容点`}
                          />
                        </ListItem>
                        {index < slides.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Paper>
            </Grid>
          </Grid>
          ) : (
            <Box sx={{ p: 2 }}>
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  上传PPT文件
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  您可以直接上传PowerPoint文件(.ppt或.pptx)，系统将自动将其转换为课程幻灯片。
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <input
                    accept=".ppt,.pptx"
                    style={{ display: 'none' }}
                    id="ppt-file-upload"
                    type="file"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                  />
                  <label htmlFor="ppt-file-upload">
                    <Button
                      variant="contained"
                      component="span"
                      startIcon={<UploadIcon />}
                      fullWidth
                      sx={{ py: 1.5 }}
                    >
                      从电脑选择PPT文件
                    </Button>
                  </label>
                  <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                    请选择电脑中的PPT文件(.ppt或.pptx格式)
                  </Typography>
                </Box>
                
                {uploadedPpt && (
                  <Box sx={{ mb: 3 }}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      已选择文件: {uploadedPpt.name} ({(uploadedPpt.size / 1024 / 1024).toFixed(2)} MB)
                    </Alert>
                    
                    <TextField
                      label="PPT标题"
                      fullWidth
                      value={pptTitle}
                      onChange={(e) => setPptTitle(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SlideshowIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  支持的文件格式: .ppt, .pptx
                </Typography>
              </Paper>
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
                上传PPT后，您可以在课程中直接使用该幻灯片进行教学。
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 下载历史对话框 */}
      <Dialog
        open={historyDialog.open}
        onClose={() => setHistoryDialog({...historyDialog, open: false})}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          下载历史记录
          <IconButton
            edge="end"
            onClick={() => setHistoryDialog({...historyDialog, open: false})}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {historyDialog.history.length === 0 ? (
            <Alert severity="info">暂无下载历史记录</Alert>
          ) : (
            <List>
              {historyDialog.history.map((item, index) => (
                <ListItem key={item.id}>
                  <ListItemText
                    primary={`${index + 1}. ${item.title}`}
                    secondary={`下载时间: ${new Date(item.timestamp).toLocaleString()}`}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {item.path}
                  </Typography>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            color="error"
            onClick={() => {
              localStorage.removeItem('pptDownloadHistory');
              setHistoryDialog({
                open: false,
                history: []
              });
              setSuccess('已清除所有下载历史记录');
            }}
            disabled={historyDialog.history.length === 0}
          >
            清除历史记录
          </Button>
          <Button onClick={() => setHistoryDialog({...historyDialog, open: false})}>
            关闭
          </Button>
        </DialogActions>
      </Dialog>

      {/* PPT预览弹窗 */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentPpt?.pptTitle || 'PPT预览'}
          <IconButton
            edge="end"
            onClick={() => setPreviewOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {currentPpt && (
            <>
              {currentPpt.pptFile.startsWith('http') ? (
            <PptViewer file={currentPpt.pptFile} />
          ) : (
            <Box sx={{ 
              p: 3,
              textAlign: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 1
            }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                正在准备下载文件...
              </Alert>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={async () => {
                  try {
                    setSuccess(`正在准备下载: ${currentPpt.pptTitle}`);
                    const response = await fetch(currentPpt.pptFile);
                    // 添加响应头日志
                    console.log('下载响应头:', {
                      status: response.status,
                      size: response.headers.get('content-length'),
                      type: response.headers.get('content-type')
                    });
                    if (!response.ok) {
                      throw new Error(`下载失败，请稍后重试 (状态码: ${response.status})`);
                    }
                    // 检查文件类型（放宽检查条件）
                    const contentType = (response.headers.get('content-type') || '').toLowerCase();
                    const isValidType = contentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
                                      contentType.includes('application/vnd.ms-powerpoint') ||
                                      contentType.includes('octet-stream'); // 添加对二进制流的支持
                    if (!isValidType) {
                      console.warn('非标准文件类型:', contentType);
                      // 不直接抛出错误，尝试继续下载
                    }
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    let downloadUrl = decodeURIComponent(currentPpt.pptFile);
                    console.log('下载链接:', downloadUrl);
                    // link.download = currentPpt.pptFile.split('/').pop() || 'presentation.pptx';
                    link.download = "http://localhost:3000" + downloadUrl
                    link.onclick = () => {
                      setTimeout(() => {
                        window.URL.revokeObjectURL(url);
                        setSuccess(`下载完成: ${currentPpt.pptTitle}`);
                      }, 100);
                    };
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } catch (error) {
                    console.error('下载失败:', error);
                    setError(`下载失败: ${error.message}`);
                  }
                }}
              >
                下载PPT文件
              </Button>
            </Box>
          )}
              {/* <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = currentPpt.pptFile;
                    link.download = currentPpt.pptFile;
                    link.click();
                  }}
                >
                  下载PPT
                </Button>
              </Box> */}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 自定义审核员管理对话框 */}
      <Dialog
        open={reviewerDialog.open}
        onClose={() => setReviewerDialog({...reviewerDialog, open: false})}
      >
        <DialogTitle>{reviewerDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{reviewerDialog.content}</Typography>
          {reviewerDialog.type === 'add' && (
            <TextField
              autoFocus
              margin="dense"
              label="管理员姓名"
              fullWidth
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewerDialog({...reviewerDialog, open: false})}>
            取消
          </Button>
          <Button 
            onClick={() => {
              reviewerDialog.onConfirm(inputValue);
              setReviewerDialog({...reviewerDialog, open: false});
              setInputValue('');
            }}
            color="primary"
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SlideManager;