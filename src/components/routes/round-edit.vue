<template>
	<div ref="editModalDiv" class="modal" tabindex="-1">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-body">
					<div class="fs-4 mb-2">Edit Pairing</div>
					<template v-for="(playerId, index) in selectPlayers">
						<select v-model="selectPlayers[index]" class="form-select">
							<option v-for="option in unlockedPlayerOptions" :value="option.id" :class="option.addClasses">
								{{option.name}}
							</option>
						</select>
						<div v-if="index < selectPlayers.length - 1" class="my-2 fs-5 text-center">v.s.</div>
					</template>
				</div>
				<div class="modal-footer">
					<button @click="closeEditModal" type="button" class="btn btn-secondary">Cancel</button>
					<button @click="submitEditModal" type="button" class ="btn btn-primary">OK</button>
				</div>
			</div>
		</div>
	</div>

	<div class="mt-2 mx-3">
		<div class="d-block ms-2 mb-2">
			<h2 class="text-warning">Edit Round {{this.roundNumber}} Pairings</h2>
		</div>
		<div class="container m-0">
			<div class="row row-cols-1 row-cols-md-2">
				<div v-for="pairing in expandedPairings" key="pairing.pairingId" class="col my-2">
					<pairing-display mode="edit" :pairing="pairing"
						@click-lock="lockPairing(pairing.pairingId)"
						@click-unlock="unlockPairing(pairing.pairingId)"
						@click-edit="openEditModal(pairing.pairingId)"
					>
					</pairing-display>
				</div>
			</div>
		</div>
		<div class="d-block ms-2">
			<button @click="clickPair" class="btn btn-lg btn-info d-block mt-3">Re-pair</button>
			<button @click="clickSubmit" :disabled="!canConfirmPairings" class="btn btn-lg btn-success d-block mt-4">
				Confirm pairings
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
	name: 'route-round-edit',
	data() {
		return {
			roundNumber: null,
			currentPairingId: null,
			selectPlayers: []
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
		...mapGetters([ 'expandedPairings' ]),
		currentPairing() {
			if (!this.currentPairingId) return null;
			return this.expandedPairings.find((elem) => (elem.pairingId === this.currentPairingId));
		},
		unlockedPlayerOptions() {
			let ret = [];
			for (let player of this.$store.getters.unlockedPlayers) {
				ret.push({
					id: player.id,
					name: player.name
				});
			}
			ret.push({
				id: 'bye',
				name: 'Bye',
				addClasses: 'pname-bye pname-bye-color'
			});
			ret.push({
				id: 'forfeit',
				name: 'Forfeit',
				addClasses: 'pname-forfeit pname-forfeit-color'
			});
			ret.push({
				id: 'none',
				name: 'None',
				addClasses: 'pname-bye'
			});
			return ret;
		},
		canConfirmPairings() {
			return !!this.$store.state.activeTournament.currentRound.pairingsValid;
		}
	},
	methods: {
		clickPair: async function() {
			await this.$store.dispatch('recalculatePairings');
		},
		clickSubmit: function() {
			this.$router.push(`/round-setup/${this.roundNumber}`);
		},
		lockPairing: async function(pairingId) {
			await this.$store.dispatch('setPairingLocked', { pairingId: pairingId, locked: true });
		},
		unlockPairing: async function(pairingId) {
			await this.$store.dispatch('setPairingLocked', { pairingId: pairingId, locked: false });
		},
		openEditModal: function(pairingId) {
			this.currentPairingId = pairingId;
			let currentPairing = this.currentPairing;
			this.selectPlayers = currentPairing.players.map((player) => player.id);
			this.modalWrapper.show();
		},
		closeEditModal: function() {
			this.currentPairingId = null;
			this.modalWrapper.hide();
		},
		submitEditModal: async function() {
			let setPlayerCount = 0;
			let realPlayerCount = 0;
			let realPlayerDedupe = {};
			let isModified = false;
			for (let i = 0; i < this.selectPlayers.length; i++) {
				let playerId = this.selectPlayers[i];
				if (playerId) setPlayerCount++;
				if (isRealPlayerId(playerId)) {
					realPlayerCount++;
					if (!realPlayerDedupe[playerId]) realPlayerDedupe[playerId] = 0;
					realPlayerDedupe[playerId]++;
				}
				if (playerId !== this.currentPairing.players[i].id) isModified = true;
			}
			if (setPlayerCount !== this.selectPlayers.length) return;
			if (realPlayerCount === 0) return;
			for (let playerId in realPlayerDedupe) {
				if (realPlayerDedupe[playerId] > 1) return;
			}

			if (isModified) {
				this.$store.commit('dirtyUpdatePairingPlayers', {
					pairingId: this.currentPairing.pairingId,
					playerIds: [ ...this.selectPlayers ]
				});
				await this.$store.dispatch('recalculatePairings');
			} else {
				await this.lockPairing(this.currentPairingId);
			}
			this.modalWrapper.hide();
		}
	},
	mounted() {
		this.modalWrapper = this.$bootstrap.addModal(this, this.$refs.editModalDiv)
	},
	components: {
		PairingDisplay
	}
};
</script>
