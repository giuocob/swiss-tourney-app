<template>
  <global-modal v-bind="globalModalState"></global-modal>
  <global-sidebar></global-sidebar>
  <div class="w-100">
    <router-view></router-view>
  </div>
</template>

<script>
import { GlobalModal, GlobalSidebar } from './components';

export default {
  name: 'AppRoot',
  async created() {
    // Fetch initial tournament state data
    let tState = await this.$storageEngine.getStoredActiveTournament();
    if (tState) this.$store.dispatch('setActiveTournament', { tournament: tState, flushStorage: false });
  },
  computed: {
    globalModalState() {
      return this.$store.state.globalModal;
    }
  },
  components: { GlobalModal, GlobalSidebar }
}
</script>
