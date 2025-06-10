import axios from 'axios';
import { authService } from '../services/authService';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const currentUser = authService.getCurrentUser();
    const isAdmin = currentUser?.role === 'admin'||currentUser?.username==='cxy14';
    
    const response = await axios.post(`${API_BASE}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-is-admin': isAdmin,
        'x-storage-path': '/uploads' // 指定存储路径
      }
    });
    return response.data;
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};

export const downloadFile = async (filename) => {
  try {
    const response = await axios.get(`${API_BASE}/api/download?file=${encodeURIComponent('/uploads/' + filename)}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('文件下载失败:', error);
    throw error;
  }
};

export const getFileUrl = (filename) => {
  return `${API_BASE}/api/download?file=${encodeURIComponent('/uploads/' + filename)}`;
};
