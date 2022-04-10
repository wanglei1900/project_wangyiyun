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
    videoId: '',    //video的标识
    videoUpdateTime: [],   //记录视频播放的时间，而且应该是对象数组（这里要思考数据类型）
    isTriggered: false    //下拉刷新的标识符
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
    // 如果没有请求视频列表的数据直接结束当前事件
    if (!videoListData.datas) {
      return
    }
    // 给需要遍历的视频列表手动添加id，方便遍历
    let index = 0
    let videoList = videoListData.datas.map(item => {
      item.id = index++
      return item
    })
    // 获取视频成功后，关闭加载的消息提示框
    wx.hideLoading()
    // 更新videoList的状态数据
    this.setData({
      videoList,
      isTriggered: false
    })
  },

  // 点击下标，排他
  selectTab(event) {
    // let navId = event.currentTarget.id    // 会自动将number转换成string
    let navId = event.currentTarget.dataset.id

    // 位移运算符，>>>0，目标数据线转换成二进制，然后去移动指定的位数，移出去的不要，不够的用零补齐
    // 右移零位会强制转换数据类型为number，强制转布尔值： !!!

    // 修改navId的状态
    this.setData({
      navId,
      // 在切换视频页下标时，将之前的视频页清空，屏幕留白
      videoList: []
    })
    // 显示正在加载
    wx.showLoading({
      title: '正在努力加载中',
    })
    // 点击下标，直接调用getVideoList()获取最新的视频列表数据
    this.getVideoList(this.data.navId)
  },

  // 点击视频、图片播放选项
  handlerPlay(event) {
    /* 
      播放新的视频，关掉之前的视频
      思路
        1.先找到关闭视频的方法  wx.createVideoContext(string id, Object this)
        2.必须找到上一个视频的实例对象，然后关掉
      设计模式：  单例模式
        1.需要创建多个对象的情况下，使用一个变量来保存
        2.当创建新的对象的时候就会把之前的对象覆盖掉
        3，节省内存空间
    */

    let vid = event.currentTarget.id

    // 使用性能优化后解决了同时播放的问题，上面的代码反而多余了
    /* this.videoContext  //首次点击为undefined，之后均为某一个视频的上下文对象
    // 若this.videoContext为真，则不是第一次点击，并且关闭当前的视频。第一次点击，这条代码直接忽略
    this.videoContext && this.vid !== vid && this.videoContext.stop()
    // 这里就使用了设计模式中的单例模式，来通过视频的vid属性 判断当前视频和上一个视频是否为同一个
    this.vid = vid */

    // 将当前点击的vid更新至data中videoId
    this.setData({
      videoId: vid
    })

    // 判断当前视频是否为已经播放记录
    let { videoUpdateTime } = this.data
    // 找当前播放记录中是否有相同vid判断是否为播放过的视频
    let videoItem = videoUpdateTime.find(item => item.vid === vid)
    // 一旦有播放记录跳转至指定的位置，跳转为api为this.videoContext.seek()
    if (videoItem) {
      this.videoContext.seek(videoItem.currentTime)
    }

    // 创建新视频上下文，可以调用api来对视频进行操作
    this.videoContext = wx.createVideoContext(vid)
    // 用image代替video和遮罩层图片进行性能优化后，需要进行视频的自动播放不然
    this.videoContext.play()
  },

  // 监听视频播放结束移除播放记录的事件
  handleEnder(event) {
    // 将当前的播放记录从 videoUpdateTime 中移除，先解构出videoUpdateTime
    let { videoUpdateTime } = this.data
    // findIndex找到播放完视频的下标
    let index = videoUpdateTime.findIndex(item => item.vid === event.currentTarget.id)
    // 截取数组，破坏原数组
    videoUpdateTime.splice(index, 1)

    // 移除完后，要更新数组
    this.setData({
      videoUpdateTime
    })
  },

  // 视频播放进度实时变化的回调
  handleTimeUpdate(event) {
    // currentTime: 2.988868   当前播放时长
    // duration: 71.64    视频总时长

    // 整理数据
    let videoTimeObj = { vid: event.currentTarget.id, currentTime: event.detail.currentTime }
    /* 
     添加播放记录到数组中
      思路：判断videoUpdateTime中是否已经有当前视频的播放记录了
      1.如果有：  删除
      2.如果没有：直接push
    */

    let { videoUpdateTime } = this.data
    // 判断播放记录是否包含当前点击的视频
    // 以下这种写法性能太差
    /* //如果没有直接push进播放数据的数组
     videoUpdateTime.every(item => item.vid !== videoTimeObj.vid) && videoUpdateTime.push(videoTimeObj)
     // 如果有，更新currentTime 
     videoUpdateTime.some(item => {
       return item.vid === videoTimeObj.vid
     }) && videoUpdateTime.map(item=>{
       if (item.vid === videoTimeObj.vid) {
           item.currentTime = videoTimeObj.currentTime
       }
     }) */

    // 换种方式，从是否能到这个相同的vid开始,find方法很契合这个思路，若没有找到返回undefined
    let videoItem = videoUpdateTime.find(item => item.vid === videoTimeObj.vid)
    if (videoItem) {  //播放记录中有相同的视频，直接更新事件
      videoItem.currentTime = videoTimeObj.currentTime
    } else {  //若没有直接push进数组
      videoUpdateTime.push(videoTimeObj)
    }

    // 将处理完的videoUpdateTime数据更新页面中的数据
    this.setData({
      videoUpdateTime
    })
  },

  // 下拉刷新的回调
  handleRefresher() {
    // 发送请求获取最的数据
    this.getVideoList(this.data.navId)
  },

  //  scroll-view 上拉触底加载的回调 
  handleSecrollToLower() {
    // mock 假数据
    let newVideoList = [
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_91A1BFD0099E5511F6B65D54A43DD9F0",
          "coverUrl": "https://p2.music.126.net/QyeDIE94taMHidCexkVQdQ==/109951163572772648.jpg",
          "height": 720,
          "width": 1280,
          "title": "麻辣鸡 Nicki Minaj《Starships》超惹火现场版，现场气氛太棒了！",
          "description": "麻辣鸡 Nicki Minaj《Starships》超惹火现场版，现场气氛太棒了！",
          "commentCount": 560,
          "shareCount": 405,
          "resolutions": [
            {
              "resolution": 240,
              "size": 28307561
            },
            {
              "resolution": 480,
              "size": 40453047
            },
            {
              "resolution": 720,
              "size": 65275993
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 340000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/C6VID_CReqmt8ETsUWaYTQ==/18499283139231828.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 340100,
            "birthday": -2209017600000,
            "userId": 479954154,
            "userType": 207,
            "nickname": "音乐诊疗室",
            "signature": "当我坐在那架破旧古钢琴旁边的时候，我对最幸福的国王也不羡慕。（合作推广请私信，或者+V信：mjs927721）",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 18499283139231828,
            "backgroundImgId": 1364493978647983,
            "backgroundUrl": "http://p1.music.126.net/i4J_uvH-pb4sYMsh4fgQAA==/1364493978647983.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": {
              "1": "音乐视频达人",
              "2": "音乐资讯达人"
            },
            "djStatus": 0,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "18499283139231828",
            "backgroundImgIdStr": "1364493978647983"
          },
          "urlInfo": {
            "id": "91A1BFD0099E5511F6B65D54A43DD9F0",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/hHrMKIiP_94942341_shd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=QXuFDFgsVLfYdbgABokcFbAenRgygOBv&sign=c2bf2c03b18320007f511c1691440c07&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 65275993,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 12100,
              "name": "流行",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            },
            {
              "id": 14112,
              "name": "Nicki Minaj",
              "alg": null
            },
            {
              "id": 16131,
              "name": "英文",
              "alg": null
            },
            {
              "id": 13164,
              "name": "快乐",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Starships",
              "id": 3203127,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 70183,
                  "name": "Nicki Minaj",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 100,
              "st": 0,
              "rt": "600902000009274290",
              "fee": 1,
              "v": 26,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 324145,
                "name": "Starships",
                "picUrl": "http://p4.music.126.net/Po6_D1P9pr5QSGVKSBCorQ==/18756568860191736.jpg",
                "tns": [],
                "pic_str": "18756568860191736",
                "pic": 18756568860191736
              },
              "dt": 210703,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 8428191,
                "vd": -48072
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5056932,
                "vd": -45662
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3371302,
                "vd": -44267
              },
              "a": null,
              "cd": "1",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 7003,
              "mv": 5428,
              "publishTime": 1329148800007,
              "privilege": {
                "id": 3203127,
                "fee": 1,
                "payed": 0,
                "st": 0,
                "pl": 0,
                "dl": 0,
                "sp": 0,
                "cp": 0,
                "subp": 0,
                "cs": false,
                "maxbr": 320000,
                "fl": 0,
                "toast": false,
                "flag": 260,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "91A1BFD0099E5511F6B65D54A43DD9F0",
          "durationms": 239500,
          "playTime": 955441,
          "praisedCount": 4951,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_1BA7D92358D2A859123F4EBFEBE1423B",
          "coverUrl": "https://p2.music.126.net/ZuR4AvIZ12ml2Sv03CvnQw==/109951163573856585.jpg",
          "height": 720,
          "width": 1280,
          "title": "13岁华裔男孩演唱《You Raise Me Up》开口瞬间征服全场！",
          "description": "13岁华裔男孩演唱《You Raise Me Up》开口瞬间征服全场！[惊恐]",
          "commentCount": 592,
          "shareCount": 2231,
          "resolutions": [
            {
              "resolution": 240,
              "size": 16766999
            },
            {
              "resolution": 480,
              "size": 27323427
            },
            {
              "resolution": 720,
              "size": 36355044
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 1000000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/0fqTn4VpqjyX7iqUe41xhA==/109951166086321221.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 1010000,
            "birthday": 883929600000,
            "userId": 347267113,
            "userType": 207,
            "nickname": "Dennnnnniel",
            "signature": ":(",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951166086321220,
            "backgroundImgId": 109951166285210370,
            "backgroundUrl": "http://p1.music.126.net/B_krR6XmlOPkkwAFIh51CA==/109951166285210360.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": [
              "电子",
              "欧美"
            ],
            "experts": {
              "1": "音乐视频达人",
              "2": "电子|欧美音乐资讯达人"
            },
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951166086321221",
            "backgroundImgIdStr": "109951166285210360"
          },
          "urlInfo": {
            "id": "1BA7D92358D2A859123F4EBFEBE1423B",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/rjtqHJsH_1722035030_shd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=NxqiWSoIZAhCFmzkQYYcKXXwCYkzEFYr&sign=918aad181772660e772208bd650034ba&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 36355044,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 57106,
              "name": "欧美现场",
              "alg": null
            },
            {
              "id": 57108,
              "name": "流行现场",
              "alg": null
            },
            {
              "id": 59108,
              "name": "巡演现场",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            },
            {
              "id": 4101,
              "name": "娱乐",
              "alg": null
            },
            {
              "id": 3101,
              "name": "综艺",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "1BA7D92358D2A859123F4EBFEBE1423B",
          "durationms": 226278,
          "playTime": 986662,
          "praisedCount": 9262,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_385155ABDEDECFB05C75AFCC69FBFDB1",
          "coverUrl": "https://p2.music.126.net/iZ5JLwMIk6AgIi94Lvlbdw==/109951164367116001.jpg",
          "height": 360,
          "width": 640,
          "title": "民歌中国《父亲的草原母亲的河》演唱：降央卓玛",
          "description": null,
          "commentCount": 26,
          "shareCount": 314,
          "resolutions": [
            {
              "resolution": 240,
              "size": 15582999
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 440000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/aafKykg34-J2il5sKZ1mEw==/109951165408031480.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 440100,
            "birthday": 921672371673,
            "userId": 86180809,
            "userType": 0,
            "nickname": "-山海无棱",
            "signature": "有些事只适合收藏，不能说，也不能想，却又不能忘。",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951165408031490,
            "backgroundImgId": 109951165424649820,
            "backgroundUrl": "http://p1.music.126.net/PHPJLipW-QACxLrAbaGlcw==/109951165424649829.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 0,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951165408031480",
            "backgroundImgIdStr": "109951165424649829"
          },
          "urlInfo": {
            "id": "385155ABDEDECFB05C75AFCC69FBFDB1",
            "url": "http://vodkgeyttp9.vod.126.net/cloudmusic/n1DLin0Z_2692174635_sd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=jkIxYitTNYiPKGYHIZgnbnckbjFepeat&sign=371dc8426c5b16ad0d9f1cb644199ff6&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 15582999,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 240
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "385155ABDEDECFB05C75AFCC69FBFDB1",
          "durationms": 179988,
          "playTime": 206284,
          "praisedCount": 633,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_7A691DC53DB3D7AE56E30E61597CC842",
          "coverUrl": "https://p2.music.126.net/toayW6np6AYcUtcKS-0V9g==/109951163874372481.jpg",
          "height": 720,
          "width": 1280,
          "title": "11岁燃爆好声音现场",
          "description": "11岁燃爆好声音现场",
          "commentCount": 113,
          "shareCount": 264,
          "resolutions": [
            {
              "resolution": 240,
              "size": 25444520
            },
            {
              "resolution": 480,
              "size": 47766300
            },
            {
              "resolution": 720,
              "size": 53821609
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 610000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/Ftt7_1rswu4WRozbxzbgaA==/109951163558507571.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 610100,
            "birthday": 1525498601691,
            "userId": 404031731,
            "userType": 0,
            "nickname": "爱吃鱼的猫302",
            "signature": "飘荡的风",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951163558507570,
            "backgroundImgId": 109951163558504200,
            "backgroundUrl": "http://p1.music.126.net/6Xy1LckmJ_aqNGlUbneV-Q==/109951163558504194.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 10,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951163558507571",
            "backgroundImgIdStr": "109951163558504194"
          },
          "urlInfo": {
            "id": "7A691DC53DB3D7AE56E30E61597CC842",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/HfnAwRZZ_2323791844_shd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=UtWMsxQHwdshaGdYFMQlBoydtOUpsZLF&sign=1db15129e9c7f2816a49a1c07a0d8c20&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 53821609,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 57106,
              "name": "欧美现场",
              "alg": null
            },
            {
              "id": 57108,
              "name": "流行现场",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "Best Of You",
              "id": 17832291,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 56781,
                  "name": "Foo Fighters",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [],
              "pop": 65,
              "st": 0,
              "rt": "",
              "fee": 8,
              "v": 20,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 1640738,
                "name": "Best Of You",
                "picUrl": "http://p4.music.126.net/VSeB_Wd86Lr18zbKlAZR5Q==/660806488302365.jpg",
                "tns": [],
                "pic": 660806488302365
              },
              "dt": 259000,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 10381150,
                "vd": -57332
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 6228725,
                "vd": -57332
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 4152513,
                "vd": -57332
              },
              "a": null,
              "cd": "1",
              "no": 1,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 1,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 7001,
              "mv": 14451375,
              "publishTime": 1117209600000,
              "privilege": {
                "id": 17832291,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 320000,
                "fl": 128000,
                "toast": false,
                "flag": 4,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "7A691DC53DB3D7AE56E30E61597CC842",
          "durationms": 171309,
          "playTime": 254068,
          "praisedCount": 1939,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_AA1CDB730613A004AD7A17AEB1766065",
          "coverUrl": "https://p2.music.126.net/g3c9wu2EvcSooYMYlEDYAA==/109951163573348588.jpg",
          "height": 720,
          "width": 1280,
          "title": "Beni biraz Anlasana",
          "description": null,
          "commentCount": 26,
          "shareCount": 480,
          "resolutions": [
            {
              "resolution": 240,
              "size": 54759314
            },
            {
              "resolution": 480,
              "size": 106912971
            },
            {
              "resolution": 720,
              "size": 159862619
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 650000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/J6hdjNJyTYQC_D6IpHD_DQ==/109951166838311413.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 650100,
            "birthday": 608042714248,
            "userId": 927662,
            "userType": 0,
            "nickname": "Obul408",
            "signature": "Obul408",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951166838311410,
            "backgroundImgId": 109951164328693200,
            "backgroundUrl": "http://p1.music.126.net/M6TyrzPDAiRzFQMQp_uZUw==/109951164328693205.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 10,
            "vipType": 11,
            "remarkName": null,
            "avatarImgIdStr": "109951166838311413",
            "backgroundImgIdStr": "109951164328693205"
          },
          "urlInfo": {
            "id": "AA1CDB730613A004AD7A17AEB1766065",
            "url": "http://vodkgeyttp9.vod.126.net/cloudmusic/KaE63LgK_1514539384_shd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=kbCviQggxNkWibceSzXOqnyMDKclEVVY&sign=f83eedd8a79c6f72e7befa3d6543df54&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 159862619,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 4103,
              "name": "演奏",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            },
            {
              "id": 23128,
              "name": "纯音乐",
              "alg": null
            },
            {
              "id": 16170,
              "name": "吉他",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "AA1CDB730613A004AD7A17AEB1766065",
          "durationms": 317000,
          "playTime": 218388,
          "praisedCount": 801,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_1F46E9468C97AF9AA4EB40E07738AD3A",
          "coverUrl": "https://p2.music.126.net/cwWIHNMT_YAYdmxGxvuYfQ==/109951164231587211.jpg",
          "height": 360,
          "width": 640,
          "title": "【GD权志龙】燃死你的狗吠现场 bullshit 大型蹦迪现场",
          "description": "",
          "commentCount": 73,
          "shareCount": 360,
          "resolutions": [
            {
              "resolution": 240,
              "size": 22247349
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 1000000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/WLFWaMt1iVhH5WnftJIWFg==/109951164886802151.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 1010000,
            "birthday": 946656000000,
            "userId": 1803087460,
            "userType": 0,
            "nickname": "娱香肉撕",
            "signature": "分享一些你一定喜欢的视频",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951164886802140,
            "backgroundImgId": 109951162868126480,
            "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 0,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951164886802151",
            "backgroundImgIdStr": "109951162868126486"
          },
          "urlInfo": {
            "id": "1F46E9468C97AF9AA4EB40E07738AD3A",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/zKDab9E3_2543133646_sd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=MdlDlIObeFzXbhoQCYFmNUHuCaKFsuXw&sign=5c5651ec9b6d49193fac4633fd4b907f&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 22247349,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 240
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "1F46E9468C97AF9AA4EB40E07738AD3A",
          "durationms": 181812,
          "playTime": 194868,
          "praisedCount": 1762,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_FD63B4C4C91613C8E7D881564E2EB922",
          "coverUrl": "https://p2.music.126.net/rGT1DMZi02ropPy-7NWWHw==/109951163787641143.jpg",
          "height": 720,
          "width": 1280,
          "title": "在唱歌过程中和明星互动的歌手，是真的稀有了",
          "description": "在唱歌过程中和明星互动的歌手，是真的稀有了",
          "commentCount": 921,
          "shareCount": 626,
          "resolutions": [
            {
              "resolution": 240,
              "size": 28974727
            },
            {
              "resolution": 480,
              "size": 49454585
            },
            {
              "resolution": 720,
              "size": 74569408
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 350000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/p0xg8RpP9ohc3xjDCiePfA==/109951163781470122.jpg",
            "accountStatus": 0,
            "gender": 0,
            "city": 350100,
            "birthday": -2209017600000,
            "userId": 1701877461,
            "userType": 0,
            "nickname": "莫想聆听",
            "signature": "",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951163781470130,
            "backgroundImgId": 109951162868126480,
            "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 0,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951163781470122",
            "backgroundImgIdStr": "109951162868126486"
          },
          "urlInfo": {
            "id": "FD63B4C4C91613C8E7D881564E2EB922",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/AEQLpfUv_2246857143_shd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=SrxvXvJSsrkafOQYDVtdkfTJwzVCSkQJ&sign=c328341b12ad638cd728b81f1d9fe4af&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 74569408,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 1101,
              "name": "舞蹈",
              "alg": null
            },
            {
              "id": 57107,
              "name": "韩语现场",
              "alg": null
            },
            {
              "id": 57108,
              "name": "流行现场",
              "alg": null
            },
            {
              "id": 10114,
              "name": "BIGBANG",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            },
            {
              "id": 23116,
              "name": "音乐推荐",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [
            {
              "name": "FANTASTIC BABY",
              "id": 30854090,
              "pst": 0,
              "t": 0,
              "ar": [
                {
                  "id": 126339,
                  "name": "BIGBANG",
                  "tns": [],
                  "alias": []
                }
              ],
              "alia": [
                "Japanese Ver."
              ],
              "pop": 100,
              "st": 0,
              "rt": null,
              "fee": 8,
              "v": 237,
              "crbt": null,
              "cf": "",
              "al": {
                "id": 3104651,
                "name": "THE BEST OF BIGBANG 2006-2014",
                "picUrl": "http://p3.music.126.net/l6BwLqjtNjMr2surmIOufg==/109951163199340826.jpg",
                "tns": [],
                "pic_str": "109951163199340826",
                "pic": 109951163199340830
              },
              "dt": 231626,
              "h": {
                "br": 320000,
                "fid": 0,
                "size": 9267244,
                "vd": -34000
              },
              "m": {
                "br": 192000,
                "fid": 0,
                "size": 5560364,
                "vd": -31500
              },
              "l": {
                "br": 128000,
                "fid": 0,
                "size": 3706924,
                "vd": -30100
              },
              "a": null,
              "cd": "1",
              "no": 12,
              "rtUrl": null,
              "ftype": 0,
              "rtUrls": [],
              "djId": 0,
              "copyright": 2,
              "s_id": 0,
              "rtype": 0,
              "rurl": null,
              "mst": 9,
              "cp": 457010,
              "mv": 0,
              "publishTime": 1416931200007,
              "privilege": {
                "id": 30854090,
                "fee": 8,
                "payed": 0,
                "st": 0,
                "pl": 128000,
                "dl": 0,
                "sp": 7,
                "cp": 1,
                "subp": 1,
                "cs": false,
                "maxbr": 999000,
                "fl": 128000,
                "toast": false,
                "flag": 261,
                "preSell": false
              }
            }
          ],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "FD63B4C4C91613C8E7D881564E2EB922",
          "durationms": 151125,
          "playTime": 3909769,
          "praisedCount": 16512,
          "praised": false,
          "subscribed": false
        }
      },
      {
        "type": 1,
        "displayed": false,
        "alg": "onlineHotGroup",
        "extAlg": null,
        "data": {
          "alg": "onlineHotGroup",
          "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
          "threadId": "R_VI_62_4AD417F4728BB8F6CBD6702434873D1B",
          "coverUrl": "https://p2.music.126.net/PZoc3yrzYqDKr4POVs2-5A==/109951163839514725.jpg",
          "height": 720,
          "width": 1280,
          "title": "T-ARA Falling U & Why We Separated",
          "description": "韩语慢摇最喜欢的就是皇冠唱的了，抗韩十八年，死于Tara",
          "commentCount": 207,
          "shareCount": 277,
          "resolutions": [
            {
              "resolution": 240,
              "size": 34079543
            },
            {
              "resolution": 480,
              "size": 55693869
            },
            {
              "resolution": 720,
              "size": 76862022
            }
          ],
          "creator": {
            "defaultAvatar": false,
            "province": 440000,
            "authStatus": 0,
            "followed": false,
            "avatarUrl": "http://p1.music.126.net/tRbadAo38Mt9KsuVnu5mjg==/109951163019633084.jpg",
            "accountStatus": 0,
            "gender": 1,
            "city": 445100,
            "birthday": 889459200000,
            "userId": 43442257,
            "userType": 0,
            "nickname": "小小金鑫",
            "signature": "音乐爱好者，喜欢搬喜欢的歌的翻唱和现场",
            "description": "",
            "detailDescription": "",
            "avatarImgId": 109951163019633090,
            "backgroundImgId": 109951165576286420,
            "backgroundUrl": "http://p1.music.126.net/wlEYQXDq1smZjQc8OA_Buw==/109951165576286420.jpg",
            "authority": 0,
            "mutual": false,
            "expertTags": null,
            "experts": null,
            "djStatus": 0,
            "vipType": 0,
            "remarkName": null,
            "avatarImgIdStr": "109951163019633084",
            "backgroundImgIdStr": "109951165576286420"
          },
          "urlInfo": {
            "id": "4AD417F4728BB8F6CBD6702434873D1B",
            "url": "http://vodkgeyttp9.vod.126.net/vodkgeyttp8/AdUX5A20_2297848844_shd.mp4?ts=1649582590&rid=15DE7D6CB9F673628F0D03F1830B9C49&rl=3&rs=lrDYVxTHdQGOggFWWWDVZUKNpceNjgim&sign=b72cf2cf2c8239812cce8cb2ec6f766f&ext=a11AObYHuIjw1tqZC3N%2BVCVACHnS0lCM1edDTzU4f2msAy9FI3CaR0S5yALSjeRh2oi0gjSGNfHgoQr5lx643518VAnY5JouPTXkKlMjqxlzj%2BbWx%2BE%2FXr1C30TRcLBRAhXM%2Bx7yssJUmgCdiJ6%2Fy1At62R%2BZwwej8CavcF6mG1OA12GhyjltdbLLq9mWeZhaMllJpqwQPQXkJlt7K7CLl30riC8l3HVnyu3BE81Qm8G8OVSbBgc7cbW4CJl5dcr",
            "size": 76862022,
            "validityTime": 1200,
            "needPay": false,
            "payInfo": null,
            "r": 720
          },
          "videoGroup": [
            {
              "id": 58100,
              "name": "现场",
              "alg": null
            },
            {
              "id": 9102,
              "name": "演唱会",
              "alg": null
            },
            {
              "id": 57107,
              "name": "韩语现场",
              "alg": null
            },
            {
              "id": 57108,
              "name": "流行现场",
              "alg": null
            },
            {
              "id": 9127,
              "name": "T-ara",
              "alg": null
            },
            {
              "id": 1100,
              "name": "音乐现场",
              "alg": null
            },
            {
              "id": 5100,
              "name": "音乐",
              "alg": null
            }
          ],
          "previewUrl": null,
          "previewDurationms": 0,
          "hasRelatedGameAd": false,
          "markTypes": null,
          "relateSong": [],
          "relatedInfo": null,
          "videoUserLiveInfo": null,
          "vid": "4AD417F4728BB8F6CBD6702434873D1B",
          "durationms": 449051,
          "playTime": 222084,
          "praisedCount": 1895,
          "praised": false,
          "subscribed": false
        }
      }
    ]

    let { videoList } = this.data
    // 扩展运算符
    videoList.push(...newVideoList)
    this.setData({
      videoList
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
    console.log('上拉刷新');
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('下拉触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({from}) {
    console.log(from);
    if (from === 'button') {
      return {
        title:'来自button的转发',
        page:'/pages/video/video',
        imageUrl:'/static/images/nvsheng.jpg'
      }
    }else{
      return {
        title:'来自menu的转发',
        page:'/pages/video/video',
        imageUrl:'/static/images/nvsheng.jpg'
      }
    }
  }
})