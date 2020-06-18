<template>
  <div class="home">
    <!-- <img alt="Vue logo" src="../assets/logo.png"> -->
    <!-- <HelloWorld msg="Welcome to Your Vue.js App"/> -->
    <StaticImage></StaticImage>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import StaticImage from '@/components/StaticImage.vue'

export default {
  name: 'Home',
  components: {
    // HelloWorld,
    StaticImage
  }
}
</script>
