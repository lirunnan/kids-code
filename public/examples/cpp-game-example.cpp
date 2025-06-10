// 简单的C++游戏示例 - 弹球游戏
// 使用我们的C++到JavaScript转换系统

#include <iostream>
using namespace std;

// 游戏状态
int ballX = 400;
int ballY = 300;
int ballSpeedX = 4;
int ballSpeedY = 4;
int paddleX = 350;
int score = 0;
bool isGameOver = false;

// 初始化游戏
void initGame() {
    ballX = 400;
    ballY = 300;
    ballSpeedX = 4;
    ballSpeedY = 4;
    paddleX = 350;
    score = 0;
    isGameOver = false;
}

// 更新游戏状态
void updateGame() {
    if (isGameOver) return;
    
    // 移动球
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // 碰撞检测 - 墙壁
    if (ballX <= 10 || ballX >= 790) {
        ballSpeedX = -ballSpeedX;
    }
    
    if (ballY <= 10) {
        ballSpeedY = -ballSpeedY;
    }
    
    // 碰撞检测 - 挡板
    if (ballY >= 540 && ballY <= 550 && 
        ballX >= paddleX && ballX <= paddleX + 100) {
        ballSpeedY = -ballSpeedY;
        score += 10;
        
        // 增加难度
        if (score % 50 == 0) {
            if (ballSpeedX > 0) ballSpeedX++;
            else ballSpeedX--;
            
            if (ballSpeedY > 0) ballSpeedY++;
            else ballSpeedY--;
        }
    }
    
    // 游戏结束检测
    if (ballY > 600) {
        isGameOver = true;
    }
}

// 渲染游戏
void renderGame() {
    // 清空画布
    clearScreen();
    
    // 绘制球
    drawCircle(ballX, ballY, 10, "red");
    
    // 绘制挡板
    drawRect(paddleX, 550, 100, 10, "blue");
    
    // 显示分数
    char scoreText[50];
    sprintf(scoreText, "分数: %d", score);
    drawText(scoreText, 20, 30, "black", 20);
    
    // 游戏结束提示
    if (isGameOver) {
        drawRect(0, 0, 800, 600, "rgba(0, 0, 0, 0.5)");
        drawText("游戏结束", 400, 300, "white", 40);
        
        char finalScoreText[50];
        sprintf(finalScoreText, "最终分数: %d", score);
        drawText(finalScoreText, 400, 340, "white", 20);
    }
}

// 处理输入
void handleInput(const char* key) {
    if (strcmp(key, "ArrowLeft") == 0) {
        paddleX -= 20;
        if (paddleX < 0) paddleX = 0;
    } else if (strcmp(key, "ArrowRight") == 0) {
        paddleX += 20;
        if (paddleX > 700) paddleX = 700;
    } else if (strcmp(key, " ") == 0 && isGameOver) {
        initGame();
    }
}

// 处理鼠标移动
void handleMouseMove(int mouseX) {
    paddleX = mouseX - 50; // 中心对齐
    if (paddleX < 0) paddleX = 0;
    if (paddleX > 700) paddleX = 700;
}

// 游戏主循环
void gameLoop() {
    updateGame();
    renderGame();
    
    // 继续下一帧
    if (!isGameOver) {
        setTimeout(gameLoop, 1000 / 60);  // 60 FPS
    }
}

// 主函数
int main() {
    printf("游戏开始！\n");
    printf("使用左右方向键或鼠标移动挡板\n");
    printf("按空格键重新开始游戏\n");
    
    // 初始化游戏
    initGame();
    
    // 设置事件处理
    function keyDownHandler(event) {
        handleInput(event.key);
    }
    
    function mouseMoveHandler(event) {
        const rect = canvas.getBoundingClientRect();
        handleMouseMove(event.clientX - rect.left);
    }
    
    // 添加事件监听
    if (typeof addEventListener === 'function') {
        addEventListener('keydown', keyDownHandler);
        addEventListener('mousemove', mouseMoveHandler);
    } else {
        window.addEventListener('keydown', keyDownHandler);
        if (typeof canvas !== 'undefined') {
            canvas.addEventListener('mousemove', mouseMoveHandler);
        }
    }
    
    // 启动游戏循环
    if (typeof requestGameLoop === 'function') {
        requestGameLoop(gameLoop);
    } else {
        window.currentGameLoop = requestAnimationFrame(gameLoop);
    }
    
    return 0;
}