<template>
	<div class="container">
		<div class="row row-cols-1 row-cols-md-2">
			<div v-for="pairing in expandedPairings" key="pairing[0].id" class="col my-2">
				<pairing-display mode="view" :player-one="pairing[0]" :player-two="pairing[1]">
				</pairing-display>
			</div>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { PairingDisplay } from '..';
import { checkRedirect } from '../../logic/routes';

export default {
	name: 'route-round-setup',
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
	computed: {
		...mapGetters([ 'expandedPairings' ])
	},
	components: {
		PairingDisplay
	}
};
</script>
