// pages/video/video.js
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupList: [],    //初始化导航标签数据
    navId: '',   //导航标签的id标识
    videoList: [],   //视频列表数据
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 页面加载即请求导航标签
    this.getVideoGroupList()
  },

  // 获取导航标签数据的功能函数
  async getVideoGroupList() {
    let result = await request('/video/group/list')
    // 更新videoGroupList
    this.setData({
      videoGroupList: result.data.slice(0, 14),
      navId: result.data[0].id
    })
    // 在获取导航标签id的时候获取
    this.getVideoList(this.data.navId)
  },

  // 获取识破列表数据的功能函数
  async getVideoList(navId) {
    let videoListData = await request('/video/group', { id: navId })
    console.log(videoListData);
    /* let index = 0
    let videoList = videoListData.datas.map(item =>{
      item.id = index++
      return item
    }) */
    // 更新videoList的状态数据
    this.setData({
      videoList:videoListData.datas
    })
  },

  // 点击下标，排他
  selectTab(event) {
    // let navId = event.currentTarget.id    // 会自动将number转换成string
    let navId = event.currentTarget.dataset.id    //
    // 位移运算符，>>>0
    // 目标数据线转换成二进制，然后去移动指定的位数，移出去的不要，不够的用零补齐
    // 右移零位会强制转换数据类型为number
    // 布尔值： !!!

    // 修改navId的状态
    this.setData({
      navId
    })
    /* this.data.videoGroupList.forEach((item)=>{
      item.selectTab = false
    }) */

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