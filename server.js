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
app.use((req, res, next) => {
    res.removeHeader('X-Content-Type-Options')
    res.removeHeader('X-Frame-Options')
})
const PORT = 3200;
const SP_FILE = path.join(__dirname, './splist.json');//商品配件
const USERS_FILE = path.join(__dirname, './users.json');//用户
const UPLOAD_FILE = path.join(__dirname, 'upload');//头像
const ORDER_FILE = path.join(__dirname, './orders.json');//订单
const MD_FILE = path.join(__dirname, './mdlist.json');//门店
const SB_FILE = path.join(__dirname, './shebei.json');//设备
const ADDRESS_FILE = path.join(__dirname, './address.json');//城市
const CHARTS_FILE = path.join(__dirname, './charts.json');//聊天

// 中间件
app.use(bodyParser.json());
// console.log(fs.readdirSync(UPLOAD_FILE));

// 确保用户文件存在
async function initializeUsersFile() {
    try {
        await fs.access(SP_FILE);
        await fs.access(USERS_FILE);
        await fs.access(ORDER_FILE);
        await fs.access(UPLOAD_FILE)
    } catch (error) {
        await fs.writeFile(SP_FILE, '[]', 'utf8');
        await fs.writeFile(USERS_FILE, '[]', 'utf8');
        await fs.writeFile(ORDER_FILE, '[]', 'utf8');
        fs.mkdir(UPLOAD_FILE, { recursive: true })
    }
}
// 设置订单列表
async function setorder() {

    var orders = JSON.parse(await fs.readFile(ORDER_FILE, 'utf8'));
    var goods = JSON.parse(await fs.readFile(SP_FILE, 'utf8'));
    orders = []
    goods = []
    for (let i = 1; i < 100; i++) {
        let number = new Date().getTime()
        orders.push({
            number: number,
            id: i,
            status: 1,
            describe: "这是描述这是描述这是描述这是描述" + i,
            createTime: "2022-12-12 12:00:00",
        });
        goods.push({
            number: number,
            id: i,
            status: 1,
            name: "配件" + i,
            createTime: "2022-12-12 12:00:00",
            imgname: i,
            jg: i
        })
    }
    await fs.writeFile(ORDER_FILE, JSON.stringify(orders, null, 2));
    await fs.writeFile(SP_FILE, JSON.stringify(goods, null, 2));
}
// setorder()

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_FILE);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        console.log(file.mimetype, '文件类型');
        const filetypes = /jpeg|jpg|png|gif|mp4/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('只允许上传图片文件'));
    }
});


// var upload = multer({ dest: 'upload/' });
app.post('/upload', upload.single('file'), async function (req, res, next) {
    console.log(req.body.id, 'reqsa');
    try {
        if (!req.file) {
            res.send({
                status: 401,
                msg: "请上传文件",
            });
        }
        const imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`
        const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
        let index = users.findIndex(v => {
            return v.id == req.body.id
        })
        console.log(index, 'index');
        if (index != -1) {
            users[index].avatar = imageUrl
        }
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        let obj = {
            status: 200,
            msg: "上传成功",
            url: imageUrl
        }
        res.send(obj);
    } catch (error) {
        console.log(error, '上传报错');
    }

})
app.post('/uploads', upload.single('file'), async function (req, res, next) {
    console.log(req.file, 'files');
    try {
        if (!req.file) {
            res.send({
                status: 401,
                msg: "请上传文件",
            });
        }
        const imageUrl = `${req.protocol}://${req.get('host')}/upload/${req.file.filename}`
        const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
        let index = users.findIndex(v => {
            return v.id == req.body.id
        })
        console.log(index, 'index');
        if (index != -1) {
            users[index].avatar = imageUrl
        }
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
        let obj = {
            status: 200,
            msg: "上传成功",
            url: imageUrl
        }
        res.send(obj);
    } catch (error) {
        console.log(error, '上传报错');
    }

})
app.use('/upload', express.static(UPLOAD_FILE));

// 注册用户
app.post('/register', async (req, res) => {
    console.log('进来了');
    try {
        console.log(req.body);
        const { phone, password, username, } = req.body;
        const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
        if (!req.body.id) {
            console.log('没有id是注册');
            if (users.some(user => user.phone === phone)) {
                console.log('该手机已注册');
                let obj = {
                    status: 409,
                    msg: "该手机已注册"
                }
                res.send(obj);
                return
            } else {
                console.log('可以注册');
                let id = new Date().getTime()
                let createTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
                users.push({ phone, password, username, id, createTime });
                await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
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
                await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
                let obj = {
                    status: 200,
                    msg: "修改成功"
                }
                res.send(obj);
            }
        }

    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// 登录接口
app.post('/login', async (req, res) => {
    try {
        const { phone, password } = req.body;
        const users = JSON.parse(await fs.readFile(USERS_FILE, 'utf8'));
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

app.use('/images', express.static(path.join(__dirname, 'imgs')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

// 获取配件列表
app.get('/pj/list', async (req, res) => {
    try {
        var users = JSON.parse(await fs.readFile(SP_FILE, 'utf8'));

        let userInfo = req.query


        var productsWithImages = users.map(product => ({
            ...product,
            // 生成完整的图片访问URL
            imageUrl: `${req.protocol}://${req.get('host')}/images/${product.imgname}.png`
        }));
        console.log(productsWithImages, 'productsWithImages');
        // res.json(productsWithImages);
        if (userInfo.name) productsWithImages = productsWithImages.filter(v => {
            return v.name.includes(userInfo.name)
        })

        const totalItems = productsWithImages.length;
        let page = parseInt(userInfo.page)
        let pageSize = parseInt(userInfo.pageSize)
        const start = (page - 1) * pageSize
        const end = start + pageSize;
        const totalPages = Math.ceil(totalItems / pageSize);
        let items = []
        items = productsWithImages.slice(start, end);
        const total = productsWithImages.length


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


// 获取订单列表
app.get('/orderList', async (req, res) => {
    try {
        var orders = JSON.parse(await fs.readFile(ORDER_FILE, 'utf8'));
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


// 模拟获取附近门店
app.get('/fjmd', async (req, res) => {
    // 
    try {
        var mdlist = JSON.parse(await fs.readFile(MD_FILE, 'utf8'));
        let userInfo = req.query

        const totalItems = mdlist.length;
        let page = parseInt(userInfo.pageNumber)
        let pageSize = parseInt(userInfo.pageSize)
        const start = (page - 1) * pageSize
        const end = start + pageSize;
        const totalPages = Math.ceil(totalItems / pageSize);
        let items = []
        items = mdlist.slice(start, end);
        const total = mdlist.length


        let obj = {
            status: 1,
            msg: "获取配件列表成功",
            data: {
                pois: items,
                count: total,
                infocode: "10000",
                status: "1",
                info: "OK",
            }
        }
        res.send(obj);

    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }

})

// 我的设备 SB_FILE

app.get('/mysb', async (req, res) => {
    // 
    try {
        var sbList = JSON.parse(await fs.readFile(SB_FILE, 'utf8'));
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
        var charts = JSON.parse(await fs.readFile(CHARTS_FILE, 'utf8'));
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
            msg: "获取聊天信息成功",
            data: {
                data: charts,
                total: total,
                pages: totalPages
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
        var charts = JSON.parse(await fs.readFile(CHARTS_FILE, 'utf8'));
        let createTime = moment(new Date()).format("YYYY-MM-DD HH:mm:ss")
        let { userName, sendUserId, userAvatar, messageContent, fileName, disMessageType, fileUrl, fileSuffix, isMyMessage } = req.body
        charts.push({ ...req.body, createTime })
        await fs.writeFile(CHARTS_FILE, JSON.stringify(charts, null, 2));
        let obj = {
            status: 200,
            msg: "发送成功",

        }

        res.send(obj);

    } catch (error) {

    }

})



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




// 启动服务器
initializeUsersFile().then(() => {
    app.listen(PORT, () => {
        console.log(`服务器运行在 http://localhost:${PORT}`);
    });
});

