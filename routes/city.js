
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const ADDRESS_FILE = path.join(__dirname, '../address.json')
// 获取城市树
router.get('/addressTree', async (req, res) => {
    // ADDRESS_FILE
    var addressTree = JSON.parse(await fs.readFile(ADDRESS_FILE, 'utf8'));
    let obj = {
        status: 200,
        msg: "获取城市成功",
        data: addressTree
    }
    res.send(obj);
})
module.exports = router; 