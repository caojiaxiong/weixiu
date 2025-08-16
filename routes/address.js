const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { writeData, readData } = require('../globals')

// /获取地址列表
router.get('/addressList', async (req, res) => {
    try {
        const address = await readData('wxAddress')
        let userInfo = req.query
        const totalItems = address.length;
        let page = parseInt(userInfo.pageNumber)
        let pageSize = parseInt(userInfo.pageSize)
        const start = (page - 1) * pageSize
        const end = start + pageSize;
        const totalPages = Math.ceil(totalItems / pageSize);
        let items = []
        items = address.slice(start, end);
        const total = address.length
        let obj = {
            status: 200,
            msg: "获取地址列表成功",
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
// 新增地址/修改
router.post('/addAddress', async (req, res) => {
    try {
        console.log(req.body, 'body');

        const address = await readData('wxAddress')

        if (!req.body.id) {
            let id = new Date().getTime()
            req.body.id = id
            address.push(req.body)

            await writeData('wxAddress', address)
            let obj = {
                status: 200,
                msg: "地址添加成功"
            }
            res.send(obj);

        } else {
            let index = address.findIndex(v => {
                return v.id == req.body.id
            })

            if (index != -1) {
                address[index] = req.body
                await writeData('wxAddress', address)
                let obj = {
                    status: 200,
                    msg: "地址修改成功"
                }
                res.send(obj);
            } else {
                res.status(500).json({ error: '查无此人' });
            }
        }
    } catch (error) {
        console.log(error, '报错');
        res.status(500).json({ error: '服务器错误' });
    }

})
// 根据id获取地址
router.get('/getAddressById', async (req, res) => {
    try {
        const address = await readData('wxAddress')
        let { id } = req.query
        let item = address.find(v => {
            return v.id == id
        })

        if (item) {
            let obj = {
                status: 200,
                msg: "查找成功",
                data: item
            }
            res.send(obj);
        } else {
            res.status(500).json({ error: '查无此人' });
        }

    } catch (error) {
        console.log(error, '报错');
        res.status(500).json({ error: '服务器错误' });
    }
})

// 删除地址

router.get('/delAddressById', async (req, res) => {
    try {
        const address = await readData('wxAddress')
        let { id } = req.query
        let index = address.findIndex(v => {
            return v.id == id
        })

        if (index != -1) {
            address.splice(index, 1)
            await writeData('wxAddress', address)
            let obj = {
                status: 200,
                msg: "删除成功",
            }
            res.send(obj);
        } else {
            res.status(500).json({ error: '查无此人' });
        }

    } catch (error) {
        console.log(error, '报错');
        res.status(500).json({ error: '服务器错误' });
    }
})

module.exports = router; 