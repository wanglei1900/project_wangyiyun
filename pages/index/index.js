// index.js

// 引入封装的ajax函数
import request from '../../utils/request'

// 获取应用实例
const app = getApp()

Page({
  data: {
    userInfo: {},
    hasUserInfo: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    canIUseGetUserProfile: false,
    canIUseOpenData: wx.canIUse('open-data.type.userAvatarUrl') && wx.canIUse('open-data.type.userNickName'), // 如需尝试获取用户信息可改为false
    banners: [],  //轮播图数据
    recommendList: [],  //推荐歌曲
    recommendBoard: [], //排行榜单
  },
  // 事件处理函数
  bindViewTap() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad() {
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }

    this.getInitData()
  },

  // 获取初始化数据函数
  async getInitData() {
    // 发请求获取数据
    let result1 = await request('/banner', { type: 2 })
    let reuslt2 = await request('/personalized', { limit: 30 })
    // 修改banners和recommendList数据
    this.setData({
      banners: result1.banners,
      recommendList: reuslt2.result
    })

    // 获取排行榜数据
    // idx:0-20   需求:0-4   发请求五次
    let topArr = []
    for (let i = 0; i < 5; i++) {
      let p = await request('/top/list', { idx: i })
      // 整理参数
      let name = p.playlist.name
      let id = p.playlist.id
      let topThree = p.playlist.tracks.slice(0, 3)
      topArr.push({ name, id, topThree })
      // 时时更新 1.优点：用户等待事件较短 2.缺点：多次更新页面，
      // 更新数据
      this.setData({
        recommendBoard: topArr
      })
    }
    // 在外面统一更新的好处  1. 优点：减少更新的次数，只更新一次  2. 缺点：网络较差时，用户等待时间过长
    //  更新数据
    /* this.setData({
      recommendBoard:topArr
    }) */

  },

  getUserProfile(e) {
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log(res)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
})
