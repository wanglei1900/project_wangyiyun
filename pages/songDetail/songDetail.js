// 引入第三方的包
import PubSub from 'pubsub-js'

// pages/songDetail/songDetail.js
import request from '../../utils/request'


Page({

    /**
     * 页面的初始数据
     */
    data: {
        isPlay: false,     //标识音乐是否播放
        song: {},     //歌曲详情
        currentWidth:0, //
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
        let ids = options.musicid
        // /song/detail
        this.getSongDetail(ids)

        // 订阅recommendSong页面发布的消息：  musicId
        PubSub.subscribe('musicId',(msg,musicId)=>{
            console.log('来自recommendSong页面发来的消息', musicId);
        })

        this.getSongDetail(musicId)

    },

    // 封装歌曲详情页获取歌曲链接的请求
    async getSongDetail(ids) {
        let result = await request('/song/detail', { ids })
        // console.log(result);
        this.setData({
            song: result.songs[0]
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
        this.setData({
            isPlay
        })

        // 控制歌曲的播放
        this.musicControl(isPlay)
    },

    // 封装控制音乐功能播放/暂停的功能函数，
    async musicControl(isPlay) {
        // 生成音频是实例
        let backgroundAudioManager = wx.getBackgroundAudioManager()
        if (isPlay) {   //播放
            let { id } = this.data.song
            // 获取音乐的播放地址
            let musicLinkData = await request('/song/url', { id })
            let musicUrl = musicLinkData.data[0].url
            backgroundAudioManager.src = musicUrl
            backgroundAudioManager.title = this.data.song.name
        } else {  //暂停
            backgroundAudioManager.pause()
        }
    },

    // 切换歌曲的回调
    handlerSwitch(event) {
        // 判断按钮是上一首还是下一首
        let { id } = event.currentTarget

        

        // 将切换歌曲的类型发送给recommend页面
        PubSub.publish('switchType',id)

        // 获取音乐最新的详情数据


        if (id == 'prev') {
            console.log('点击了上一首');
        } else {
            console.log('点击了下一首');
        }
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