<template>
  <div class="page-jumper">
    <div class="page page-0" >
      <div class="loading-txt">{{0}}%</div>
      <div class="logo"></div>
    </div>
  </div>
</template>

<script>
  export default {
    name:'pageJumper',
    created(){
      location.href = 'index.html'
    }
  }
</script>

<style lang="scss">
  @import '@/assets/scss/global.scss';
  .page-jumper{
    width:100%;
    height: 100%;
    position: relative;
    .page-title{
      text-align: center;
      font-size: .4rem;
      color: #333;
      padding-top: 3rem;
    }
    .page{
      width:100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      .bg-img{
        width: 7.5rem;
        position: absolute;
        top: 0;
        left: 0;
        z-index: -1;
      }
      .logo{
        width: 2.93rem;
        height: .66rem;
        // @include gSetBg('../images/logo.png');
        margin-top:.4rem;
        margin-left: .4rem;
      }
    }
    .page-0{
      background-color: #ffe9d4;
      z-index: 100;
      .loading-txt{
        text-align: center;
        font-size: .4rem;
        color: #d92208;
        padding-top: 4rem;
      }
      .logo{
        margin: 0 auto;
        margin-top: .5rem;
      }
    }
  }
</style>