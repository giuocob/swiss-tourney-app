<template>
	<div class="mx-3 mt-4">
		<h1>LEYGO</h1>
	</div>
</template>

<script>
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-tournament-setup',
	data() {
		return {
			roundNumber: null
		};
	},
	created() {
		this.roundNumber = parseInt(this.$route.params.roundNumber);
		if (isNaN(this.roundNumber)) return this.$router.push('/')
		checkRedirect(this, {
			tStateReqs: {
				lifecycle: 'in-progress',
				roundLifecycle: 'setup',
				currentRoundNumber: this.roundNumber
			}
		});
	},
	methods: {
	}
};
</script>
