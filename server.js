// 数据库

require('dotenv').config()
const { Redis } = require('@upstash/redis');
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 文件服务器
const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name: process.env.CLOUND_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET // Click 'View API Keys' above to copy your API secret
});
// 
const express = require('express');
const fs = require('fs').promises;
var multer = require('multer')
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const moment = require('moment')
app.use(cors());

const PORT = 3000;
// 处理 application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// 处理 application/json
app.use(bodyParser.json());

// 解析文本格式的Raw数据（可选）
app.use(bodyParser.text({ type: 'text/*' }));

// 写入数据
const writeData = async (name, data) => {
    await redis.set(name, data);
}
// 读取数据
const readData = async (name) => {
    try {
        const data = await redis.get(name); // 返回 "value"
        // console.log(users, '获取数据库user');
        return data || []
    } catch (error) {
        console.log(error, '报错');

        return []
    }
}

// 上传图片
// 设置存储配置
const upload = multer();
app.post('/upload', upload.single('image'), async function (req, res, next) {
    console.log(req.file, 'req');
    try {
        const fileBuffer = req.file.buffer;
        const result = await cloudinary.uploader.upload('data:image/png;base64,' + fileBuffer.toString('base64'), {
            resource_type: 'auto',
            folder: "jz",
        });
        res.json({
            url: result.secure_url,
            success: true,
            message: '上传成功',
        });
    } catch (error) {
        console.log(error, '上传失败了');

        res.status(500).json({ error: 'Upload failed' });
    }

})

// 注册用户
app.post('/register', async (req, res) => {

    try {
        const { phone, password, username, } = req.body;
        const users = await readData('wxUsers')
        if (!req.body.id) {
            if (users.some(user => user.phone === phone)) {
                let obj = {
                    status: 409,
                    msg: "该手机已注册"
                }
                res.send(obj);
                return
            } else {
                let id = new Date().getTime()
                let createTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
                users.push({ phone, password, username, id, createTime });
                writeData('wxUsers', users)
                let obj = {
                    status: 200,
                    msg: "注册成功"
                }
                res.send(obj);
            }
        } else {
            console.log('是修改');
            let index = users.findIndex(v => {
                return v.id == req.body.id
            })
            if (index != -1) {
                users[index] = {
                    phone, password, username,
                }
                writeData('wxUsers', users)
                let obj = {
                    status: 200,
                    msg: "修改成功"
                }
                res.send(obj);
            }
        }

    } catch (error) {
        console.log(error, '报错');

        res.status(500).json({ error: '服务器错误' });
    }
});

// 登录接口
app.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const users = await readData('wxUsers')
        const hasUser = users.find(u => u.phone === phone);
        const user = users.find(u => u.phone === phone && u.password === password);
        if (!hasUser) {
            console.log('手机号未注册');
            let obj = {
                status: 401,
                msg: "手机号未注册"
            }
            res.send(obj);
            return
        } else if (!user) {
            console.log('手机或密码错误');
            let obj = {
                status: 401,
                msg: "手机或密码错误"
            }
            res.send(obj);
            return
        } else if (user) {
            console.log('登录成功');
            const token = jwt.sign({ phone }, 'your-secret-key');
            user.token = token
            let obj = {
                status: 200,
                msg: "登录成功",
                user
            }
            res.send(obj);
        }


    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
        let obj = {
            status: 500,
            msg: "服务器错误"
        }
        res.send(obj);

    }
});


// 获取配件列表
app.get('/pj/list', async (req, res) => {
    try {
        const peijians = await readData('peijian')
        let userInfo = req.query
        const totalItems = peijians.length;
        let page = parseInt(userInfo.page)
        let pageSize = parseInt(userInfo.pageSize)
        const start = (page - 1) * pageSize
        const end = start + pageSize;
        const totalPages = Math.ceil(totalItems / pageSize);
        let items = []
        items = peijians.slice(start, end);
        const total = peijians.length
        let obj = {
            status: 200,
            msg: "获取配件列表成功",
            data: {
                data: items,
                total: total,
                pages: totalPages
            }
        }
        res.send(obj);
    } catch (error) {
        console.log(error, '报错');

        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取订单列表
app.get('/orderList', async (req, res) => {
    try {
        const orders = await readData('wxOrders')
        let userInfo = req.query
        const totalItems = orders.length;
        let page = parseInt(userInfo.pageNumber)
        let pageSize = parseInt(userInfo.pageSize)
        const start = (page - 1) * pageSize
        const end = start + pageSize;
        const totalPages = Math.ceil(totalItems / pageSize);
        let items = []
        items = orders.slice(start, end);
        const total = orders.length
        let obj = {
            status: 200,
            msg: "获取配件列表成功",
            data: {
                data: items,
                total: total,
                pages: totalPages
            }
        }
        res.send(obj);

    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 我的设备 SB_FILE
app.get('/mysb', async (req, res) => {
    try {
        const sbList = await readData('wxSbs')
        let userInfo = req.query

        const totalItems = sbList.length;
        let page = parseInt(userInfo.pageNumber)
        let pageSize = parseInt(userInfo.pageSize)
        const start = (page - 1) * pageSize
        const end = start + pageSize;
        const totalPages = Math.ceil(totalItems / pageSize);
        let items = []
        items = sbList.slice(start, end);
        const total = sbList.length


        let obj = {
            status: 200,
            msg: "获取配件列表成功",
            data: {
                data: items,
                total: total,
                pages: totalPages
            }
        }

        res.send(obj);

    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }

})
// 聊天 CHARTS_FILE
app.get('/charts', async (req, res) => {
    // 
    try {

        const charts = await readData('wxCharts')

        let obj = {
            status: 200,
            msg: "获取聊天信息成功",
            data: {
                data: charts,
            }
        }

        res.send(obj);

    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }

})

// 添加消息 addmsg
app.post('/addmsg', async (req, res) => {
    try {
        const charts = await readData('wxCharts')
        let createTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        let { userName, sendUserId, userAvatar, messageContent, fileName, disMessageType, fileUrl, fileSuffix, isMyMessage } = req.body
        charts.push({ ...req.body, createTime })

        writeData('wxCharts','charts')
        let obj = {
            status: 200,
            msg: "发送成功",

        }

        res.send(obj);

    } catch (error) {

    }

})



const ADDRESS_FILE = path.join(__dirname, 'address.json')
// 获取城市树
app.get('/addressTree', async (req, res) => {
    // ADDRESS_FILE
    var addressTree = JSON.parse(await fs.readFile(ADDRESS_FILE, 'utf8'));

    let obj = {
        status: 200,
        msg: "获取列表成功",
        data: addressTree
    }

    res.send(obj);

})

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err)
    res.status(500).json({
        success: false,
        message: '服务器内部错误'
    })
})


// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});

