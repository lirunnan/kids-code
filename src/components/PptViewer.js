import React, { useState } from 'react';
import { Box, Button, Alert, LinearProgress } from '@mui/material';
import { CloudDownload, CloudUpload } from '@mui/icons-material';
import { uploadFile, downloadFile } from '../api/fileApi';

const PptViewer = ({ file, onUploadSuccess }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!file) {
      setError('没有可下载的文件');
      return;
    }
    
    try {
      setError(null);
      const filename = file.split('/').pop();
      
      // 确保文件名以.pptx或.ppt结尾
      if (!filename.match(/\.pptx?$/i)) {
        throw new Error('文件格式不支持，仅支持PPT文件');
      }

      const blob = await downloadFile(filename);
      
      if (!blob || blob.size === 0) {
        throw new Error('获取的文件为空');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setError('下载已开始，请稍候...');
    } catch (error) {
      console.error('下载失败:', error);
      setError(`下载失败: ${error.message}`);
    }
  };

  const handleUpload = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const response = await uploadFile(selectedFile);
      if (response.requiresApproval) {
        setError('上传成功，等待管理员审批');
      } else {
        onUploadSuccess?.(response.path);
      }
    } catch (error) {
      setError(error.message || '上传失败');
    } finally {
      setIsUploading(false);
    }
  };

  const isLocalFile = file ? !file.startsWith('http') : false;
  const [previewError, setPreviewError] = useState(false);

  if (!file) return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <Button disabled startIcon={<CloudDownload />}>
        无可用文件
      </Button>
    </Box>
  );
  
  const getViewerUrl = () => {
    try {
      if (isLocalFile) {
        // 确保文件路径以/开头
        const normalizedPath = file.startsWith('/') ? file : `/${file}`;
        return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + normalizedPath)}`;
      }
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file)}`;
    } catch (error) {
      console.error('生成预览URL失败:', error);
      setPreviewError(true);
      return null;
    }
  };

  const viewerUrl = getViewerUrl();
  
  return (
    <Box sx={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
      {previewError || !viewerUrl ? (
        <Box sx={{ 
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f5f5f5',
          borderRadius: 1
        }}>
          <Alert severity="error">
            PPT预览加载失败，请尝试下载后查看
          </Alert>
        </Box>
      ) : (
        <iframe
          src={viewerUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          title="PPT预览"
          style={{ flex: 1 }}
          onError={() => setPreviewError(true)}
        />
      )}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        {error && (
          <Alert severity={error.includes('成功') ? 'success' : 'error'} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <input
          accept=".ppt,.pptx"
          style={{ display: 'none' }}
          id="ppt-upload"
          type="file"
          onChange={handleUpload}
        />
        <label htmlFor="ppt-upload">
          <Button
            variant="outlined"
            component="span"
            startIcon={<CloudUpload />}
            disabled={isUploading}
            sx={{ mr: 2, minWidth: '200px' }}
          >
            {isUploading ? '上传中...' : '上传PPT'}
          </Button>
        </label>
        <Button
          variant="contained"
          startIcon={<CloudDownload />}
          onClick={handleDownload}
          disabled={!file}
          sx={{ minWidth: '200px' }}
        >
          下载PPT
        </Button>
        {isUploading && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PptViewer;
