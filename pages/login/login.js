/* 
登录注册的流程：
  1.收集表单项数据
  2.前端验证
    1).验证用户信息是否合法（账号密码格式是否违规）
    2).前端验证不通过，就是提示客户输入内容不合法，不发请求
    3).如果前端验证通过，发请求（账号、密码）进行后端验证
  3.后端验证
    1).验证当前用户是否存在
    2).如果验证用户不存在，直接返回登录失败（该用户不存在）
    3).该用户存在，需要验证密码是否正确
    4).如果密码不正确，返回给前端，并提示密码不正确
    5).如果密码正确，返回登录成功的数据
*/
import request from '../../utils/request'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone: '', //收集手机号用于登录
    password: '' //收集密码
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  // 表单项的事件回调
  handlerInput(event) {
    // let type = event.currentTarget.id // id 适合传唯一标识
    let type = event.currentTarget.dataset.type // data-key="value" 适合传多个标识
    this.setData({
      /* 
      type为获取的标识符，和data绑定的phone和password同名
      对象的key写法，obj.[phone]  obj.[password]
      故直接将变量type这样书写[type]，即可自动匹配data里的phone和password
      */
      [type]: event.detail.value
    })
  },
  // 登录回调
  async login() {
    // 1.收集表单项数据
    let { phone, password } = this.data
    // 2.前端验证
    /* 
      手机号验证
        1.内容为空
        2.手机号格式不正确
        3，手机号格式正确，验证通过
    */
    if (!phone) {  //1.内容为空
      //  alert('手机号不能为空')    //没有alert
      // 提示用户 类似elementui的$messagebox
      wx.showToast({
        title: '手机号不能为空',
        icon: 'error'
      })
      return
    }
    // 定义正则表达式
    let phoneReg = /^1[3-9][0-9]{9}$/
    if (!phoneReg.test(phone)) {  //2.手机号格式不正确
      // 提示用户
      wx.showToast({
        title: '手机号格式错误',
        icon: 'error'
      })
      return
    }
    // 验证密码 
    if (!password) {
      // 提示用户
      wx.showToast({
        title: '密码不能为空',
        icon: 'error'
      })
      return
    }
    // 首先我们需要用到一个 WxValidate插件 - 表单验证的js插件（未完成）

    // 后端验证
    let result = await request('/login/cellphone', { phone, password, isLogin: true })
    // console.log(result);
    // 200,400,501,502
    if (result.code == 200) {
      // 登录成功
      wx.showToast({
        title: '登录成功',
      })
      // 将用户信息存入至本地
      wx.setStorageSync('userInfo', result.profile)
      // 跳转个人中心
      wx.reLaunch({
        url: '/pages/personal/personal',
      })
    } else if (result.code == 400) {
      wx.showToast({
        title: '手机号错误',
        icon: 'error'
      })
    } else if (result.code == 502) {
      wx.showToast({
        title: '密码错误',
        icon: 'error'
      })
    } else {
      wx.showToast({
        title: '登录失败，请重新登录',
      })
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