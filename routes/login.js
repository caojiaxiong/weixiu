const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { writeData, readData } = require('../globals')
// 注册
router.post('/register', async (req, res) => {

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
router.post('/login', async (req, res) => {
    console.log(222);
    
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

module.exports = router; 