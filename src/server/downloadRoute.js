const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 限制10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.ms-powerpoint' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      cb(null, true);
    } else {
      cb(new Error('仅支持PPT文件'), false);
    }
  }
});

// 文件上传接口
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }
    
    // 检查用户权限
    const isAdmin = req.headers['x-is-admin'] === 'true';
    const requiresApproval = !isAdmin;
    
    res.json({ 
      success: true,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      requiresApproval,
      isAdminUpload: !requiresApproval
    });
  } catch (error) {
    console.error('上传错误:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/download', (req, res) => {
  try {
    const filePath = decodeURIComponent(req.query.file);
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send('File not found');
    }

    // 验证文件扩展名
    const ext = path.extname(filePath).toLowerCase();
    if (!['.ppt', '.pptx'].includes(ext)) {
      return res.status(400).json({ error: '仅支持PPT文件下载' });
    }

    // 检查文件是否存在且是文件类型
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return res.status(400).json({ error: '请求的不是有效文件' });
    }

    // 设置正确的Content-Type
    const contentType = ext === '.ppt' 
      ? 'application/vnd.ms-powerpoint'
      : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    
    res.setHeader('Content-Type', contentType);
    res.sendFile(fullPath, {
      headers: {
        'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
      }
    }, (err) => {
      if (err) {
        console.error('文件下载错误:', err);
        res.status(500).json({ error: '文件下载失败' });
      }
    });
  } catch (error) {
    console.error('Download handler error:', error);
    res.status(400).send('Invalid request');
  }
});

module.exports = router;
