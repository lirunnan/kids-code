const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const express = require('express');
const downloadRoute = require('./server/downloadRoute');

module.exports = function(app) {
  // 显式添加静态文件服务
  app.use('/public', express.static(path.join(__dirname, '../public')));
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
  
  // 注册下载路由
  app.use('/api', downloadRoute);
  
  // 文件列表API代理
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://120.48.27.201:7001',
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('Content-Disposition', 'attachment');
      }
    })
  );
};
