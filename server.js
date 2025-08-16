
require('dotenv').config()
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const moment = require('moment');
const { writeData, readData } = require('./globals.js');

const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
const PORT = 3001;

// 静态文件服务
app.use(express.static(path.join(__dirname, '.')));
// 处理 application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// 处理 application/json
app.use(bodyParser.json());
// 解析文本格式的Raw数据（可选）
app.use(bodyParser.text({ type: 'text/*' }));
// 注册用户
const loginRoutes = require('./routes/login.js');
// 上传
const uploadRoutes = require('./routes/upload.js');
// 商品
const goodsRoutes = require('./routes/goods.js');
// 订单
const ordersRoutes = require('./routes/orders.js');
// 我的设备
const deviceRoutes = require('./routes/device.js');
// 城市树
const cidyRoutes = require('./routes/city.js');
// 地址管理
const addressRoutes = require('./routes/address.js');
try {
    app.use('/', loginRoutes)
    app.use('/', uploadRoutes)
    app.use('/', goodsRoutes)
    app.use('/', ordersRoutes)
    app.use('/', deviceRoutes)
    app.use('/', cidyRoutes)
    app.use('/', addressRoutes)
    console.log('路由挂载成功');
} catch (error) {
    console.log('路由挂载失败:', error);
}

// 聊天 CHARTS_FILE (支持分页)
app.get('/charts', async (req, res) => {
    try {
        const charts = await readData('wxCharts')
        charts.reverse()
         let userInfo = req.query

        const totalItems = charts.length;
        let page = parseInt(userInfo.pageNumber)
        let pageSize = parseInt(userInfo.pageSize)
        const start = (page - 1) * pageSize
        const end = start + pageSize;
        const totalPages = Math.ceil(totalItems / pageSize);
        let items = []
        items = charts.slice(start, end);
        const total = charts.length


        let obj = {
            status: 200,
            msg: "获取配件列表成功",
            data: {
                data: items.reverse(),
                total: total,
                pages: totalPages
            }
        }

 
        res.send(obj);
    } catch (error) {
        console.error('获取聊天记录失败:', error);
        res.status(500).json({ 
            status: 500,
            msg: '服务器错误',
            error: error.message 
        });
    }
})

// 添加消息 addmsg
app.post('/addmsg', async (req, res) => {
    try {
        const charts = await readData('wxCharts')
        let createTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        let { userName, sendUserId, userAvatar, messageContent, fileName, disMessageType, fileUrl, fileSuffix, isMyMessage } = req.body
        
        const newMessage = { ...req.body, createTime, id: Date.now().toString() }
        charts.push(newMessage)

        await writeData('wxCharts', charts)
        
        // 通过WebSocket广播新消息
        io.emit('newMessage', newMessage)
        
        let obj = {
            status: 200,
            msg: "发送成功",
            data: newMessage
        }

        res.send(obj);

    } catch (error) {
        console.error('发送消息失败:', error)
        res.status(500).json({ 
            status: 500,
            msg: "发送失败",
            error: error.message 
        })
    }
})

// WebSocket连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);
    
    // 用户加入聊天
    socket.on('joinChat', (userData) => {
        socket.userData = userData;
        console.log(`${userData.userName || '匿名用户'} 加入聊天`);
        
        // 通知其他用户有新用户加入
        socket.broadcast.emit('userJoined', {
            userId: socket.id,
            userName: userData.userName,
            userAvatar: userData.userAvatar,
            joinTime: moment().format("YYYY-MM-DD HH:mm:ss")
        });
    });
    
    // 实时发送消息
    socket.on('sendMessage', async (messageData) => {
        try {
            const charts = await readData('wxCharts');
            const createTime = moment().format("YYYY-MM-DD HH:mm:ss");
            
            const newMessage = {
                ...messageData,
                createTime,
                id: Date.now().toString(),
                socketId: socket.id
            };
            
            charts.push(newMessage);
            await writeData('wxCharts', charts);
            
            // 广播消息给所有连接的客户端
            io.emit('newMessage', newMessage);
            
        } catch (error) {
            console.error('实时发送消息失败:', error);
            socket.emit('messageError', { error: '发送失败' });
        }
    });
    
    // 用户正在输入
    socket.on('typing', (userData) => {
        socket.broadcast.emit('userTyping', {
            userId: socket.id,
            userName: userData.userName,
            isTyping: true
        });
    });
    
    // 用户停止输入
    socket.on('stopTyping', (userData) => {
        socket.broadcast.emit('userTyping', {
            userId: socket.id,
            userName: userData.userName,
            isTyping: false
        });
    });
    
    // 用户断开连接
    socket.on('disconnect', () => {
        console.log('用户断开连接:', socket.id);
        if (socket.userData) {
            socket.broadcast.emit('userLeft', {
                userId: socket.id,
                userName: socket.userData.userName,
                leaveTime: moment().format("YYYY-MM-DD HH:mm:ss")
            });
        }
    });
});

// 获取在线用户列表
app.get('/online-users', (req, res) => {
    const connectedUsers = [];
    for (let [id, socket] of io.sockets.sockets) {
        if (socket.userData) {
            connectedUsers.push({
                socketId: id,
                ...socket.userData
            });
        }
    }
    
    res.json({
        status: 200,
        msg: "获取在线用户成功",
        data: {
            count: connectedUsers.length,
            users: connectedUsers
        }
    });
});

// 删除消息
app.delete('/deletemsg/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const charts = await readData('wxCharts');
        
        const messageIndex = charts.findIndex(msg => msg.id === messageId);
        if (messageIndex === -1) {
            return res.status(404).json({
                status: 404,
                msg: "消息不存在"
            });
        }
        
        charts.splice(messageIndex, 1);
        await writeData('wxCharts', charts);
        
        // 通知所有客户端消息被删除
        io.emit('messageDeleted', { messageId });
        
        res.json({
            status: 200,
            msg: "删除成功"
        });
        
    } catch (error) {
        console.error('删除消息失败:', error);
        res.status(500).json({
            status: 500,
            msg: "删除失败",
            error: error.message
        });
    }
});

// 清空聊天记录
app.delete('/clear-chat', async (req, res) => {
    try {
        await writeData('wxCharts', []);
        
        // 通知所有客户端聊天记录被清空
        io.emit('chatCleared');
        
        res.json({
            status: 200,
            msg: "聊天记录已清空"
        });
        
    } catch (error) {
        console.error('清空聊天记录失败:', error);
        res.status(500).json({
            status: 500,
            msg: "清空失败",
            error: error.message
        });
    }
});


// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err)
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    })
})


// 启动服务器
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`WebSocket服务已启动，支持实时聊天功能`);
});

