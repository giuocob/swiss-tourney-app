<template>
	<pe-form @submit="submitPeForm"></pe-form>
</template>

<script>
	import PeForm from '../pe-form.vue';

	export default {
		name: 'route-player-entry',
		methods: {
			submitPeForm(entries) {
				this.$store.commit('setParticipants', entries);
				this.$router.push('/');
			}
		},
		components: { PeForm }
	};
</script>
