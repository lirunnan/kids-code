// 简单的JavaScript游戏示例 - 弹球游戏

// 游戏状态
const state = {
  ball: { x: 400, y: 300, dx: 4, dy: 4, radius: 10 },
  paddle: { x: 350, y: 550, width: 100, height: 10 },
  score: 0,
  gameOver: false
};

// 获取Canvas上下文
const ctx = canvas.getContext('2d');

// 初始化游戏
function initGame() {
  state.ball.x = 400;
  state.ball.y = 300;
  state.ball.dx = 4;
  state.ball.dy = 4;
  state.paddle.x = 350;
  state.score = 0;
  state.gameOver = false;
  
  // 设置事件监听
  window.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  
  // 启动游戏循环
  gameLoop();
}

// 处理鼠标移动
function handleMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  state.paddle.x = e.clientX - rect.left - state.paddle.width / 2;
  
  // 确保挡板不会超出画布
  if (state.paddle.x < 0) {
    state.paddle.x = 0;
  }
  if (state.paddle.x + state.paddle.width > canvas.width) {
    state.paddle.x = canvas.width - state.paddle.width;
  }
}

// 处理键盘输入
function handleKeyDown(e) {
  if (e.key === 'ArrowLeft') {
    state.paddle.x -= 20;
    if (state.paddle.x < 0) {
      state.paddle.x = 0;
    }
  } else if (e.key === 'ArrowRight') {
    state.paddle.x += 20;
    if (state.paddle.x + state.paddle.width > canvas.width) {
      state.paddle.x = canvas.width - state.paddle.width;
    }
  } else if (e.key === ' ' && state.gameOver) {
    initGame(); // 重新开始游戏
  }
}

// 更新游戏状态
function update() {
  if (state.gameOver) return;
  
  // 移动球
  state.ball.x += state.ball.dx;
  state.ball.y += state.ball.dy;
  
  // 检测与墙壁的碰撞
  if (state.ball.x - state.ball.radius <= 0 || 
      state.ball.x + state.ball.radius >= canvas.width) {
    state.ball.dx = -state.ball.dx;
  }
  
  if (state.ball.y - state.ball.radius <= 0) {
    state.ball.dy = -state.ball.dy;
  }
  
  // 检测与挡板的碰撞
  if (state.ball.y + state.ball.radius >= state.paddle.y && 
      state.ball.y - state.ball.radius <= state.paddle.y + state.paddle.height &&
      state.ball.x >= state.paddle.x && 
      state.ball.x <= state.paddle.x + state.paddle.width) {
    
    state.ball.dy = -state.ball.dy;
    state.score += 10;
    
    // 增加难度
    if (state.score % 50 === 0) {
      if (state.ball.dx > 0) state.ball.dx += 0.5;
      else state.ball.dx -= 0.5;
      
      if (state.ball.dy > 0) state.ball.dy += 0.5;
      else state.ball.dy -= 0.5;
    }
  }
  
  // 检测游戏结束
  if (state.ball.y + state.ball.radius > canvas.height) {
    state.gameOver = true;
  }
}

// 渲染游戏
function render() {
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制球
  ctx.fillStyle = 'red';
  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // 绘制挡板
  ctx.fillStyle = 'blue';
  ctx.fillRect(state.paddle.x, state.paddle.y, state.paddle.width, state.paddle.height);
  
  // 显示分数
  ctx.fillStyle = 'black';
  ctx.font = '20px Arial';
  ctx.fillText(`分数: ${state.score}`, 20, 30);
  
  // 游戏结束提示
  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width/2, canvas.height/2);
    ctx.font = '20px Arial';
    ctx.fillText(`最终分数: ${state.score}`, canvas.width/2, canvas.height/2 + 40);
    ctx.textAlign = 'left';
  }
}

// 游戏主循环
function gameLoop() {
  update();
  render();
  
  // 继续游戏循环
  window.currentGameLoop = requestAnimationFrame(gameLoop);
}

// 停止游戏
function stopGame() {
  if (window.currentGameLoop) {
    cancelAnimationFrame(window.currentGameLoop);
  }
}

// 在状态区显示游戏说明
statusDiv.innerHTML = `
  <p>游戏说明：</p>
  <p>- 使用鼠标或左右方向键移动挡板</p>
  <p>- 防止球落到底部</p>
  <p>- 游戏结束后按空格键重新开始</p>
`;

// 启动游戏
initGame();