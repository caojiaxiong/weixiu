const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { writeData, readData } = require('../globals')

// 获取订单列表
router.get('/orderList', async (req, res) => {
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

module.exports = router; 