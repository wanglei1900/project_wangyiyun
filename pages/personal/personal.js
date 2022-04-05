let startY = 0; // 手指起始坐标
let moveY = 0;  // 手指移动实时坐标
let moveDistance = 0; //手指移动的距离

import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 位移的变量
    coverTransform: 0,
    // 位移的过度效果，分场景
    coverTransition: '',
    // 用户信息
    userInfo: {},
    // 最近播放记录
    recentPlayList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 读取本地存储的用户信息
    let userInfo = wx.getStorageSync('userInfo')
    // 判断如果用户信息有了，说明登录了。
    if (userInfo) {
      // 更新userInfo
      this.setData({
        userInfo
      })
      // console.log(this.data.userInfo.userId);
      // 只有用户登录了才能发请求获取用户播放记录
      this.getRecentPlayData(this.data.userInfo.userId)
    }
  },

  // 用户播放记录功能函数
  async getRecentPlayData(userId) {
    let result = await request('/user/record', { uid: userId, type: 0 })
    // 后端数据没有返回值
    let index = 0
    let recentPlayList = result.allData.slice(0, 10).map(item => {
      item.id = index++
      return item
    })
    this.setData({
      recentPlayList
    })
  },

  // 点击跳转登录页面
  tapLogin() {
    // 判断用户是否已经登录,已经登录直接return
    // 这里为什么一定要用userInfo的属性判断真假，因为userInfo是空对象，恒为true
    if (this.data.userInfo.nickname) {
      return
    }
    wx.navigateTo({
      url: '/pages/login/login',
    })
  },
  // 手指点击事件
  handlerTouchStart(event) {
    // 手指点击前清除之前的过度效果
    this.setData({
      coverTransition: ''  //每次重新点击取消过度效果
    })
    // 获取手指起始坐标,找到捕获的第一个手指
    startY = event.touches[0].clientY
  },
  // 手指移动事件
  handlerTouchMove(event) {
    moveY = event.touches[0].clientY
    // 计算手指移动的距离
    moveDistance = moveY - startY
    // 通过判断来控制允许的收拾移动距离
    if (moveDistance < 0) {
      moveDistance = 0   // 拖拽区域不允许向上移动
    } else if (moveDistance > 80) (
      moveDistance = 80   // 拖拽区域的边界为80（rpx）
    )
    // 控制cover移动，更新coverTransform的状态数据
    this.setData({
      coverTransform: `translateY(${moveDistance}rpx)`  //这里必须带单位rpx或者px
    })
  },
  // 手指松开事件
  handlerTouchEnd() {
    this.setData({
      coverTransform: 'translateY(0)',  //松开后位移变为0
      coverTransition: 'transform .2s linear'  //简单的过度效果
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