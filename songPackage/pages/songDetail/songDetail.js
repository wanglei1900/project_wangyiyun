// 引入第三方的包
import PubSub from 'pubsub-js'
import request from '../../../utils/request'
import moment from 'moment'

// 获取全局app实例
let appInstance = getApp()
Page({
    /**
     * 页面的初始数据
     */
    data: {
        isPlay: false,     //标识音乐是否播放
        song: {},     //歌曲详情
        musicId: '',    //音乐id
        musicUrl: '',    //音乐的播放链接
        currentWidth: 0,     //进度条实时的进度
        currentTime: '00:00',     //实时播放的时长
        durationTime: '00:00',        //总时长
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        /* options 用来接收路由跳转的参数，默认值是空对象
        JSON.parse 将对象json对象编译成js对象
        注意！！原生小程序url有长度限制，如果传参内容过长会自动截取掉
        let song = JSON.parse(options) */
        // console.log(options);
        // 获取音乐id
        let musicId = options.musicid
        this.setData({
            musicId
        })
        this.getSongDetail(musicId)

        // 判断当前音乐是否在播放
        if (appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId) {
            // 说明音乐在播放，修改当前页面音乐播放状态为trur
            this.setData({
                isPlay: true
            })
        }

        // 生成音频是实例
        this.backgroundAudioManager = wx.getBackgroundAudioManager()
        // 【监听】音乐播放/暂停/停止
        this.backgroundAudioManager.onPlay(() => {
            this.changePlayStatus(true)
            appInstance.globalData.musicId = musicId
        })
        this.backgroundAudioManager.onPause(() => {
            this.changePlayStatus(false)
        })
        this.backgroundAudioManager.onStop(() => {
            this.changePlayStatus(false)
        })
        this.backgroundAudioManager.onTimeUpdate(() => {
            // console.log('总时长',this.backgroundAudioManager.duration);
            // console.log('当前时间',this.backgroundAudioManager.currentTime);

            // 格式化实时播放事件
            let currentTime = moment(this.backgroundAudioManager.currentTime * 1000).format('mm:ss')
            let currentWidth = this.backgroundAudioManager.currentTime / this.backgroundAudioManager.duration * 450
            // 更新事件
            this.setData({
                currentTime,
                currentWidth
            })
        })
        // 监听歌曲自然播放结束
        this.backgroundAudioManager.onEnded(() => {
            // 自动切换到下一首音乐，并且自动播放
            // 将切换歌曲的类型发送给recommend页面,并赋值'next'参数
            PubSub.publish('switchType', 'next')
            // 还原状态
            this.setData({
                currentWidth: 0,     //进度条实时的进度
                currentTime: '00:00',     //实时播放的时长
                durationTime: '00:00',        //总时长
            })
        })

        // 订阅recommendSong页面发布的消息：  musicId
        PubSub.subscribe('musicId', (msg, musicId) => {
            // console.log('来自recommendSong页面发来的消息', musicId);
            // 获取最新的音乐详情数据
            this.getSongDetail(musicId)
            // 自动播放当前音乐(为了自动播放，第一个参数肯定给true,第三个参数不应该传直接请求新的数据)
            this.musicControl(true, musicId)
        })
    },

    // 给onload里封装播放状态的函数
    changePlayStatus(status) {
        this.setData({
            isPlay: status
        })
        // 修改全局音乐播放状态
        appInstance.globalData.isMusicPlay = status

    },

    // 封装歌曲详情页获取歌曲链接的请求
    async getSongDetail(musicId) {
        let result = await request('/song/detail', { ids: musicId })
        let durationTime = result.songs[0].dt
        this.setData({
            song: result.songs[0],
            durationTime: moment(durationTime).format('mm:ss')
        })

        // 设置详情页的歌曲名字
        wx.setNavigationBarTitle({
            title: this.data.song.name,
        })
    },

    // 点击播放事件的回调
    handleMusicPlay() {
        let isPlay = !this.data.isPlay
        // 修改播放状态的标识符
        // onload监听里已经完成以下代码
        /* this.setData({
            isPlay
        }) */

        let { musicId, musicUrl } = this.data

        // 控制歌曲的播放
        this.musicControl(isPlay, musicId, musicUrl)
    },

    // 封装控制音乐功能播放/暂停的功能函数，
    async musicControl(isPlay, musicId, musicUrl) {
        if (isPlay) {   //播放  
            if (!musicUrl) {    //  ||(musicId!==this.data.musicId)
                // 获取音乐的播放地址
                let musicLinkData = await request('/song/url', { id: musicId })
                musicUrl = musicLinkData.data[0].url

                this.setData({
                    musicUrl
                })
            }

            this.backgroundAudioManager.src = musicUrl
            this.backgroundAudioManager.title = this.data.song.name

            // 修改全局的音乐播放状态
            // onload监听里已经完成以下两步
            // appInstance.globalData.isMUsicPlay = true
            // appInstance.globalData.musicId = musicId

        } else {  //暂停
            this.backgroundAudioManager.pause()
            // 修改全局的音乐播放状态
            // onload监听里已经完成以下两步
            // appInstance.globalData.isMUsicPlay = false
            // appInstance.globalData.musicId = musicId
        }
    },

    // 切换歌曲的回调
    handlerSwitch(event) {
        // 判断按钮是上一首还是下一首
        let { id } = event.currentTarget

        // 关闭当前播放的音乐
        this.backgroundAudioManager.stop()

        PubSub.subscribe('musicId', (msg, musicId) => {
            // 获取切歌后的音乐信息
            this.getSongDetail(musicId)
            // 自动播放切歌后的信息
            this.musicControl(true, musicId)
        })


        // 将切换歌曲的类型发送给recommend页面
        PubSub.publish('switchType', id)

        // 获取音乐最新的详情数据


        /* if (id == 'prev') {
            console.log('点击了上一首');
        } else {
            console.log('点击了下一首');
        } */
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})