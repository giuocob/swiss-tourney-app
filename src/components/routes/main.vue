<template>
	<button @click="sillyModal" class="btn btn-danger btn-lg">MODAL MY DUDE</button>
	<div v-if="hasParticipants">
		<participant-display></participant-display>
	</div>
	<div v-else>
		<button @click="$router.push('/player-entry')" class="btn btn-success">Enter Players</button>
	</div>
</template>

<script>
	import ParticipantDisplay from '../participant-display.vue';

	export default {
		name: 'route-main',
		computed: {
			hasParticipants() {
				return !!this.$store.state.participants && (this.$store.state.participants.length > 0);
			}
		},
		methods: {
			sillyModal() {
				this.$store.commit('showGlobalModal', {
					mode: 'areYouSure',
					message: 'THAT WAS NOT WISE',
					submitAction: {
						action: 'redirect',
						link: '/player-entry'
					}
				});
			}
		},
		components: { ParticipantDisplay }
	};
</script>
