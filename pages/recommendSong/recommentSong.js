// 引入第三方的包
import PubSub from 'pubsub-js'

import request from '../../utils/request'
// pages/recommendSong/recommentSong.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: '',
    month: '',
    recommendList: [],   //每日推荐数据
    index: 0,    //点击歌曲列表的下标
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 动态获取当前日期
    this.setData({
      day: new Date().getDate(),
      month: new Date().getMonth() + 1
    })

    // 调用方法getRecommendSongs
    this.getRecommendSongs()

    // 订阅songDetail发布的id消息
    PubSub.subscribe('switchType', (msg, switchType) => {
      // console.log(msg,data);
      let { recommendList, index } = this.data
      if (switchType == 'prev') {   // 上一首
        // 判断临界值
        (index === 0) && (index = recommendList.length)
        index -= 1
      } else {    //  下一首
        (index === recommendList.length -1 ) && (index = -1)
        index += 1
      }

      let musicId = recommendList[index].id

      // 必须更新下标
      this.setData({
        index
      })

      // 将最新的musicid发送给songdetail页面
      PubSub.publish('musicId', musicId)
    })
  },

  // 获取每日推荐歌曲  recommendList
  async getRecommendSongs() {
    let result = await request('/recommend/songs')
    // console.log(result);
    this.setData({
      recommendList: result.recommend
    })
  },

  // 点击歌曲跳转songDetail
  toSongDetail(event) {
    // console.log(event);
    // let song = event.currentTarget.dataset.song
    // let musicId = event.currentTarget.dataset.id
    let { song, musicid, index } = event.currentTarget.dataset
    // 更新点击记录的下标
    this.setData({
      index
    })

    // 路由跳转传参： query
    wx.navigateTo({
      url: '/pages/songDetail/songDetail?musicid=' + musicid,
    })
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