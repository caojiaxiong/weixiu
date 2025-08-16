const express = require('express');
const router = express.Router();
var multer = require('multer')

const { writeData, readData, cloudinary } = require('../globals')

// 获取配件列表
router.get('/pj/list', async (req, res) => {
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
module.exports = router; 