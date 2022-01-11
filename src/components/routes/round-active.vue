<template>
	<div ref="scoreModalDiv" class="modal" tabindex="-1">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-body">
					<div class="fs-4 mb-2">Game Result</div>
					<div class="input-group mb-2">
						<span class="input-group-text">
							{{this.currentPairing && this.currentPairing.players[0].name}}
						</span>
						<input v-model="currentPairingWins[0]" type="number" class="form-control numeric-small">
					</div>
					<div class="input-group mb-2">
						<span class="input-group-text">
							{{this.currentPairing && this.currentPairing.players[1].name}}
						</span>
						<input v-model="currentPairingWins[1]" type="number" class="form-control numeric-small">
					</div>
					<div class="input-group">
						<span class="input-group-text">Draw</span>
						<input v-model="currentPairingDraws" type="number" class="form-control numeric-small">
					</div>
				</div>
				<div class="modal-footer">
					<button @click="closeScoreModal" type="button" class="btn btn-secondary">Cancel</button>
					<button @click="submitScoreModal" type="button" class="btn btn-primary" :disabled="!canSubmitModal">
						Submit
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-2 mx-3">
		<div class="d-block ms-2 mb-2">
			<h2>Round {{this.roundNumber}}</h2>
		</div>
		<div class="container m-0">
			<div class="row row-cols-1 row-cols-md-2">
				<div v-for="pairing in expandedPairings" key="pairing.pairingId" class="col my-2">
					<pairing-display mode="active" :pairing="pairing"
						@click-score="openScoreModal(pairing.pairingId)"
					>
					</pairing-display>
				</div>
			</div>
		</div>
		<div class="d-block ms-2 my-3">
			<button @click="clickCancel" class="btn btn-sm btn-danger d-block mt-3">Cancel round</button>
			<button @click="clickCompleteRound" :disabled="!canCompleteRound" class="btn btn-lg btn-success d-block mt-4">
				Complete Round
			</button>
		</div>
	</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { PairingDisplay } from '..';
import { checkRedirect } from '../../logic/routes';
import { isRealPlayerId } from '../../logic/tournament';

export default {
	name: 'route-round-active',
	data() {
		return {
			roundNumber: null,
			currentPairingId: null,
			currentPairingWins: [ 0, 0 ],
			currentPairingDraws: 0
		};
	},
	created() {
		this.roundNumber = parseInt(this.$route.params.roundNumber);
		if (isNaN(this.roundNumber)) return this.$router.push('/')
		checkRedirect(this, {
			tStateReqs: {
				lifecycle: 'in-progress',
				roundLifecycle: 'in-progress',
				currentRoundNumber: this.roundNumber
			}
		});
	},
	computed: {
		...mapGetters([ 'expandedPairings' ]),
		currentPairing() {
			if (!this.currentPairingId) return null;
			return this.expandedPairings.find((elem) => (elem.pairingId === this.currentPairingId));
		},
		canSubmitModal() {
			const MAX_WINS = 2;
			if (!this.currentPairingWins[0] && !this.currentPairingWins[1] && !this.currentPairingDraws) {
				return false;
			}
			if (this.currentPairingWins[0] > MAX_WINS || this.currentPairingWins[1] > MAX_WINS) {
				return false;
			}
			return true;
		},
		canCompleteRound() {
			let allSubmitted = true;
			for (let pairing of this.expandedPairings) {
				if (!pairing.submitted) allSubmitted = false;
			}
			return allSubmitted;
		}
	},
	methods: {
		clickCancel: async function() {
			this.$store.dispatch('showGlobalModal', {
				mode: 'areYouSure',
				message: 'Cancel round? All submitted scores will be lost.',
				submitAction: [
					{
						type: 'dispatchAction',
						action: 'cancelRound'
					},
					{
						type: 'redirect',
						link: `/round-setup/${this.roundNumber}`
					}
				]
			});
		},
		async clickCompleteRound() {
			await this.$store.dispatch('completeRound');
			this.$router.push('/round-complete');
		},
		openScoreModal: function(pairingId) {
			this.currentPairingId = pairingId;
			let currentPairing = this.currentPairing;
			this.currentPairingWins = currentPairing.wins || [ 0, 0 ];
			this.currentPairingDraws = currentPairing.draws || 0;
			this.modalWrapper.show();
		},
		closeScoreModal: function() {
			this.currentPairingId = null;
			this.modalWrapper.hide();
		},
		submitScoreModal: async function() {
			if (!this.canSubmitModal) return;
			await this.$store.dispatch('submitPairingScores', {
				pairingId: this.currentPairingId,
				wins: this.currentPairingWins,
				draws: this.currentPairingDraws
			});
			this.modalWrapper.hide();
		}
	},
	mounted() {
		this.modalWrapper = this.$bootstrap.addModal(this, this.$refs.scoreModalDiv)
	},
	components: {
		PairingDisplay
	}
};
</script>
