<template>
  <div class="page-game" ref="Jpage">
    <div class="page page-0" v-if="loading">
      <div class="loading-txt">{{loadingTxt}}%</div>
      <div class="logo"></div>
    </div>
    <div class="page page-1">

    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import qs from 'qs'

  import vanPopup from 'vant/lib/popup';
  import 'vant/lib/popup/style';
  import vanIcon from 'vant/lib/icon';
  import 'vant/lib/icon/style';
  import vanField from 'vant/lib/field';
  import 'vant/lib/field/style';
  import Toast from 'vant/lib/toast';
  import 'vant/lib/toast/style';

  import qaData from './q';
  export default {
    name:'pageAuth',
    data(){
      return {
        // root:'https://wx.fangchengyan.com/api/',
        root:location.href.indexOf('thinkerchan')>-1?'https://wx.fangchengyan.com/api/': 'https://app.cmbgz.cn/api/',
        auth:'wx/authorize',
        userInfo:'user/answer/userInfo',
        rank:'user/answer/rank',
        signature:'user/answer/signature',
        report:'user/answer/report',
        testMode:false, // 测试模式

        loading:true,
        loadingTxt:0,
        pageScale:1,
        cssText:'',
        startTime:0,
        rawTime:0,
        isWeixin: navigator.userAgent.toLowerCase().indexOf('micromessenger')>-1,

      }
    },
    components:{
      vanPopup,
      vanIcon,
      vanField
    },
    created(){
      return;

      let testMode = location.href.indexOf('testMode=true')>-1;
      if (testMode) {
        this.testMode = true
      }
      if (window.pageRadio > window.maxRadio) {
        this.pageScale = +(window.maxRadio / window.pageRadio ).toFixed(2)
        this.cssText = `transform:scale(${this.pageScale});transform-origin: 50% 0 0 `;
      }

      this.checkAuth()
      this.setShare()
      this.preload(()=>{
        this.loading  = false
        this.showPage1 = true
      })
    },
    methods:{
      preload(cb){
        let list=[
          {src:require("../images/bg-1.jpg")},
          {src:require("../images/bg-2.jpg")},
          {src:require("../images/bg-3.jpg")},
        ]

        const loader = new createjs.LoadQueue(false);
        loader.loadManifest(list);
        loader.on("progress",(p)=>{
            let percent = parseInt(p.progress*100);
            this.loadingTxt = percent;
        });

        loader.on("complete",()=>{
          cb && cb()
        });
      },
      checkAuth(){
        if (location.href.indexOf('localhost')>-1) {
          this.testMode = true
          return;
        }
        let urlObj = this.parseURL(location.href)
        this.openId = urlObj.params.openId
        if (this.openId || this.testMode) {
          this.getUserInfo(this.openId)
        }else{
          this.go2auth(location.href)
        }
      },
      go2auth(url){
        location.href = this.root+this.auth+'?redirect='+url
      },
      parseURL(url) {
        let a =  document.createElement('a');
        a.href = url;
        return {
          source: url,
          protocol: a.protocol.replace(':',''),
          host: a.hostname,
          port: a.port,
          query: a.search,
          params: (()=>{
            let ret = {},
            seg = a.search.replace(/^\?/,'').split('&'),
            len = seg.length, i = 0, s;
            for (;i<len;i++) {
              if (!seg[i]) { continue; }
              s = seg[i].split('=');
              ret[s[0]] = s[1];
            }
            return ret;
          })(),
          file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
          hash: a.hash.replace('#',''),
          path: a.pathname.replace(/^([^\/])/,'/$1'),
          relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
          segments: a.pathname.replace(/^\//,'').split('/')
        };
      },
      init(){
        this.qIndex = 0
        this.showPage2=false
        this.showPage3=false
        this.time = 0
        this.timer = null
        this.rawTime = 0
        this.renderList = []
        this.lock = null
        this.checkLen = []
        this.hasSubmit = false
      },
      gameStart(){
        this.showPage2 = true
        this.timeStart()

        let tar = this.$refs.audio;
        tar.id = 0;

        if (this.autoPlay) {
          let tar = this.$refs.audio;
          tar.play();
          tar.id = 1;
        }
        window._czc &&  window._czc.push(["_trackEvent", "gameStat", "点击游戏按钮",this.nickname]);
      },
      playMp3(){
        let tar = this.$refs.audio;
        if (!tar.id||tar.id=='0') {
          tar.play();
          tar.id = 1
        }else{
          tar.pause();
          tar.id = 0
        }
      },
      choose(itm,idx){
        if (this.lock) {
          return;
        }

        this.$refs.audio.pause();
        let curQuestion = this.renderList[this.qIndex]
        let curAnswer = curQuestion.answer[idx]

        if (itm.hint) {
          curAnswer.on = true
          this.audioEffect && this.$refs.Jyes.play()
          this.checkLen.push(1)
        }else{
          curAnswer.off = true
          this.audioEffect && this.$refs.Jno.play()
          this.qDesc =  curQuestion.desc
        }

        this.$forceUpdate();

        if (this.qIndex>= this.qLen-1) { // 最后一题
          this.lock = true
          this.rawTime = (new Date).getTime() - this.startTime;

          let t = setTimeout(()=>{
            this.showPage3 = true
            clearInterval(this.timer)
            this.timer = null
            console.log('页面计时', this.time);
            console.log('真实用时:', this.fixRawTime(this.rawTime));

            clearTimeout(t)
            t = null
          },this.delay)
          return;
        }

        this.lock = setTimeout(() => { // 下一题
          this.go2nextQuestion()
          clearTimeout(this.lock)
          this.lock = null;
        }, this.delay);
      },
      go2nextQuestion(){
        this.qIndex++
        this.qDesc = ''

        let tar = this.$refs.audio;
        tar.id = 0;

        // 题目渐进
        this.fadeIn = true

        let ft = setTimeout(() => {
          this.fadeIn = false
          clearTimeout(ft)
          ft = null
        }, 500);

        // 300ms之后保证音频可以播放
        if (this.autoPlay) {
          let t = setTimeout(() => {
            tar.play();
            tar.id = 1;
            clearTimeout(t)
            t = null
          }, 300);
        }
      },
      openSubmitPop(){
        if (!this.isWeixin) {
          Toast('请在微信浏览器体验完整功能')
          return;
        }
        this.showRulePop=true
      },
      openResPop(){
        this.showRulePop2=true
      },
      getUserInfo(openId){
        if (this.testMode) {
          return;
        }

        axios({
          url:this.root+this.userInfo,
          params:{
            openId
          }
        }).then((data)=>{
          let rawData = data.data,
            code = rawData.code,
            res = rawData.data;

          if (!code) {
            this.nickname = res.nickname
            this.avatar = res.headImgUrl
          }else{
            console.log(rawData);
          }
        }).catch((err)=>{
          console.log(err);
        })
      },
      timeStart(){
        this.startTime = (new Date).getTime();
        this.timer = setInterval(() => {
          this.time++
        }, 1000);
      },
      fixTime(s=0){
        return  ~~(s/60) + '分' + s%60 +'秒'
      },
      fixRawTime(s=0, bool=false){
        if (bool) {
          return  ~~(s/(60*1000))+'分' + ~~((s%(60*1000))/(1000))+'秒' + (s%1000)+'毫秒';
        }else{
          return (~~(s/1000)+((s%1000)/1000)).toFixed(2)+'秒';
        }
      },
      randomIndex(array){
        return ~~(Math.random()*array.length)
      },
      genArr(array){
        let fixArr = this.remainArr.length>= this.qLen? this.remainArr : JSON.parse(JSON.stringify(array)) // 第一次进来和replay区别处理

        fixArr.map((item,index)=>{
          item.answer = this.randomSort(item.answer)  // 对remainArr会做二次随机
        })

        for (let index = 0; index < this.qLen; index++) {
          let randomIndex = this.randomIndex(fixArr);
          this.renderList.push(fixArr.splice(randomIndex,1)[0])
        }

        if (this.mock) {
          this.remainArr = fixArr
        }

      },
      go2pageResult(){
        this.showPage3 = true
        clearInterval(this.timer)
      },

      setLoading(str){
        Toast.loading({
          message: str,
          forbidClick: true,
          duration:0,
        });
      },

      setShare(){
        if (this.testMode) {
          return;
        }
        axios({
          method:'post',
          url:this.root+this.signature,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          transformRequest: [(data)=> {
            data = qs.stringify(data)
            return data
          }],
          data:{
            url: encodeURIComponent(location.href.split('#')[0]),
          }
        }).then((data)=>{
          let rawData = data.data,
            code = rawData.code,
            res = rawData.data;

          if (!code) {
            this.registerWx(res)
          }else{
            console.log(rawData);
          }
        }).catch((err)=>{
          console.log(err);
        })
      },
      registerWx(data){
        window.wx && wx.config({
          debug: false, // 取消
          appId: data.appId,
          timestamp: data.timestamp,
          nonceStr: data.nonceStr,
          signature: data.signature,
          jsApiList: [
            'checkJsApi',
            'onMenuShareTimeline',
            'onMenuShareAppMessage',
          ]
        });

        wx.ready(()=>{
          const shareData = {
            title: document.title,
            desc: '我在城市便捷酒店《方言大挑战》小游戏中打败了99.8%的人，来和我PK，一起赢好礼！',
            link: location.href.split('?')[0],
            imgUrl: 'https://www1.pconline.com.cn/test/gz/202101271000/img/cover.jpg',
            success: ()=> {
              window._czc &&  window._czc.push(["_trackEvent", "shareSuccess", "微信分享成功",this.nickname]);
            },
            cancel: ()=>{
              window._czc &&  window._czc.push(["_trackEvent", "shareFailed", "微信分享取消",this.nickname]);
            }
          };
          wx.onMenuShareAppMessage(shareData);
          wx.onMenuShareTimeline(shareData);
        });
        wx.error((res)=>{
          Toast(res.errMsg);
        });
      },
      randomSort(arr) {
        let len = arr.length;
        for (let i = 0; i < len - 1; i++) {
            let index = parseInt(Math.random() * (len - i));
            let temp = arr[index];
            arr[index] = arr[len - i - 1];
            arr[len - i - 1] = temp;
        }
        return arr;
      },
      preShare(){
        this.showSharePop = true
        window._czc &&  window._czc.push(["_trackEvent", "preShare", "点击好友PK",this.nickname]);
      },
      fixPage(){
        let t = setTimeout(() => {
          clearTimeout(t)
          t = null
          this.$refs.Jpage.scrollIntoView();
        }, 50)
      }
    },
    watch:{
      showRankPop(val){
        window.scrollLock = !val
      }
    }
  }
</script>

<style lang="scss">
  @import '@/assets/scss/global.scss';
  .page-game{

  }
</style>