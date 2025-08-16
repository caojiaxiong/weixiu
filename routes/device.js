const express = require('express');
const router = express.Router();
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { writeData, readData } = require('../globals')

// 我的设备 SB_FILE
router.get('/mysb', async (req, res) => {
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

module.exports = router; 