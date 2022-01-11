<template>
<div class="mt-2 mx-3">
	<div v-if="isComplete" class="mb-2">
		<h2>Final Standings</h2>
	</div>
	<standings-display players="players"></standings-display>
</div>
</template>

<script>
import { checkRedirect } from '../../logic/routes';
import { StandingsDisplay } from '..';

export default {
	name: 'route-standings',
	created() {
		checkRedirect(this, {
			tStateReqs: {
				lifecycle: [ 'in-progress', 'complete' ]
			}
		});
	},
	computed: {
		players() {
			return this.$store.state.activeTournament.players;
		},
		isComplete() {
			let tState = this.$store.state.activeTournament || {};
			return (tState.lifecycle === 'complete');
		}
	},
	components: { StandingsDisplay }
}
</script>
