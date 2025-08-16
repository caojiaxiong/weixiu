const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const wss = new WebSocket.Server({ port: 8080 });

console.log('WebSocket 服务器已启动，监听端口 8080');

// 存储所有连接的客户端
const clients = new Map();

wss.on('connection', (ws) => {
  // 为新连接生成唯一ID
  const clientId = uuidv4();
  clients.set(ws, { id: clientId, name: `用户${Math.floor(Math.random() * 1000)}` });
  
  console.log(`新客户端连接: ${clientId} (总连接数: ${clients.size})`);
  
  // 发送欢迎消息给新客户端
  ws.send(JSON.stringify({
    type: 'system',
    message: '欢迎加入聊天室!',
    clientId,
    timestamp: new Date().toISOString()
  }));
  
  // 通知所有用户有新成员加入
  broadcast(JSON.stringify({
    type: 'system',
    message: `新用户 ${clients.get(ws).name} 加入聊天室`,
    timestamp: new Date().toISOString()
  }), ws);
  
  // 处理来自客户端的消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // 更新用户名
      if (data.type === 'setName' && data.name) {
        const oldName = clients.get(ws).name;
        clients.get(ws).name = data.name;
        
        broadcast(JSON.stringify({
          type: 'system',
          message: `${oldName} 更名为 ${data.name}`,
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      // 广播聊天消息
      if (data.type === 'message' && data.content) {
        const client = clients.get(ws);
        const messageData = {
          type: 'message',
          senderId: client.id,
          senderName: client.name,
          content: data.content,
          timestamp: new Date().toISOString()
        };
        
        broadcast(JSON.stringify(messageData));
        console.log(`收到来自 ${client.name} 的消息: ${data.content}`);
      }
    } catch (e) {
      console.error('消息解析错误:', e);
    }
  });
  
  // 处理连接关闭
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      console.log(`客户端断开连接: ${client.name} (${client.id})`);
      clients.delete(ws);
      
      // 通知所有用户有成员离开
      broadcast(JSON.stringify({
        type: 'system',
        message: `${client.name} 离开了聊天室`,
        timestamp: new Date().toISOString()
      }));
    }
  });
  
  // 处理错误
  ws.on('error', (error) => {
    console.error(`客户端错误: ${error.message}`);
  });
});

// 广播消息给所有客户端（可选排除发送者）
function broadcast(message, excludeWs = null) {
  clients.forEach((_, ws) => {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// 服务器状态监控
setInterval(() => {
  console.log(`当前连接数: ${clients.size}`);
}, 30000);