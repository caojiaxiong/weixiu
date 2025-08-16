
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
module.exports = {
    myGlobalVariable: '这是一个全局变量',
    writeData, readData,cloudinary
};