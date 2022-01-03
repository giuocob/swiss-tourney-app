<template>
  <global-modal v-bind="globalModalState"></global-modal>
  <div class="container w-100">
    <div class="row">
      <div class="col-lg-12">
        <h1 class="text-center">My first beautiful page!!!</h1>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-lg-12">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { GlobalModal } from './components';

export default {
  name: 'App',
  computed: {
    globalModalState() {
      return this.$store.state.globalModal;
    }
  },
  components: { GlobalModal }
}
</script>
