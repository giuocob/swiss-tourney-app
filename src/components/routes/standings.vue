<template>
<div class="mt-2 mx-3">
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
				lifecycle: 'in-progress'
			}
		});
	},
	computed: {
		players() {
			return this.$store.state.activeTournament.players;
		}
	},
	components: { StandingsDisplay }
}
</script>
