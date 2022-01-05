<template>
	<pe-form @submit="submitPeForm"></pe-form>
</template>

<script>
	import PeForm from '../pe-form.vue';
	import { checkRedirect } from '../../logic/routes';

	export default {
		name: 'route-player-entry',
		created() {
			checkRedirect(this, { tStateLifecycle: 'setup-player-entry' });
		},
		methods: {
			submitPeForm(entries) {
				this.$store.commit('setParticipants', entries);
				this.$router.push('/');
			}
		},
		components: { PeForm }
	};
</script>
