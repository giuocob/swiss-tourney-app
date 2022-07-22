<template>
<div class="mt-2 mx-3">
	<div v-if="isComplete" class="mb-2">
		<h2>Final Standings</h2>
	</div>
	<standings-display players="players"></standings-display>
</div>
<div class="d-block ms-2 my-3">
	<div class="d-block mt-3">
		<button @click="clickExportCsv" class="btn btn-sm btn-primary d-inline">CSV Export</button>
	</div>
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
	methods: {
		clickExportCsv() {
			this.$store.dispatch('downloadStandingsCsv');
		},
	},
	components: { StandingsDisplay }
}
</script>
