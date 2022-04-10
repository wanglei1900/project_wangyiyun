// 发送ajax请求
/*
* 1. 封装功能函数
*   1. 功能点明确
*   2. 函数内部应该保留固定代码(静态的)
*   3. 将动态的数据抽取成形参，由使用者根据自身的情况动态的传入实参
*   4. 一个良好的功能函数应该设置形参的默认值(ES6的形参默认值)
* 2. 封装功能组件
*   1. 功能点明确
*   2. 组件内部保留静态的代码
*   3. 将动态的数据抽取成props参数，由使用者根据自身的情况以标签属性的形式动态传入props数据
*   4. 一个良好的组件应该设置组件的必要性及数据类型
*     props: {
*       msg: {
*         required: true,
*         default: 默认值，
*         type: String
*       }
*     }
* */
// 引入服务器配置对象
import config from './config'

export default (url, data = {}, method = 'GET') => {
    return new Promise((resolve, reject) => {
        // 1.初始化promise状态为pending
        // 2.执行异步人物
        wx.request({
            url: config.host + url,
            data,
            method,
            header: {
                // 首先需要对cookies数组中的某一项，找到带'MUSIC_U'字段
                // 然后判断本地cookies已经返回，如果没有，直接取空串
                'cookie': wx.getStorageSync('cookies')?wx.getStorageSync('cookies').find(item => item.indexOf('MUSIC_U') !== -1):''
            },
            // 3.根据异步任务的结果修改promise的状态
            success: (res) => {
                // 登录成功请求，将用户cookine字段保存至本地
                if (data.isLogin) {
                    wx.setStorageSync('cookies', res.cookies)
                }
                // console.log(res, 'request42行');
                // 修改promise状态为成功resolve
                resolve(res.data)
            },
            fail: (err) => {
                console.log('请求失败', err);
                // 修改promise状态 为成功reject
                reject(err)
            }
        })
    })
}