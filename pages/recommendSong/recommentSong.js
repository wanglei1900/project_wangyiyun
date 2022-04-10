
import request from '../../utils/request'
// pages/recommendSong/recommentSong.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    day: '',
    month: '',
    recommendList:[],   //每日推荐数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 动态获取当前日期
    this.setData({
      day: new Date().getDate(),
      month: new Date().getMonth()+1
    })

    // 调用方法getRecommendSongs
    this.getRecommendSongs()
  },

  // 获取每日推荐歌曲  recommendList
  async getRecommendSongs(){
    let result = await request('/recommend/songs')
    // console.log(result);
    this.setData({
      recommendList: result.recommend
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