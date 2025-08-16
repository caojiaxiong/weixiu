const express = require('express');
const router = express.Router();
var multer = require('multer')

const { writeData, readData, cloudinary } = require('../globals')


// 上传图片
// 设置存储配置
const upload = multer();
router.post('/upload', upload.single('image'), async function (req, res, next) {
    console.log(req.file, 'req');
    try {
        const fileBuffer = req.file.buffer;
        const result = await cloudinary.uploader.upload('data:image/png;base64,' + fileBuffer.toString('base64'), {
            resource_type: 'auto',
            folder: "weixiu",
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

module.exports = router; 