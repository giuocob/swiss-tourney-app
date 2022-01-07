<template>
<div class="pairing-card">
	<div class="paired-players">
		<template v-for="(player, index) in [ playerOne, playerTwo ]">
			<div class="ms-3 fs-5">
				<div class="d-inline player-name" :class="getPlayerClasses(player)">
					{{player.name}}
				</div>
				<div v-if="player.standing" class="d-inline me-3 player-scores">
					{{player.standing}}
				</div>
			</div>
			<div v-if="index === 0" class="horizontal-separator ms-1"></div>
		</template>
	</div>
	<template v-if="mode === 'setup'">
		<div class="vertical-separator ms-3 my-1"></div>
		<div class="button-container">
			<button @click="this.$emit('click-edit')" class="btn btn-warning mx-3 mb-3">
				EDIT
			</button>
			<button v-if="locked" @click="this.$emit('click-unlock')" class="btn btn-danger mx-3">
				UNLOCK
			</button>
			<button v-else @click="this.$emit('click-lock')" class="btn btn-danger mx-3">
				LOCK
			</button>
		</div>
	</template>
</div>
</template>

<script>
export default {
	name: 'PairingDisplay',
	props: {
		playerOne: {
			type: Object,
			required: true
		},
		playerTwo: {
			type: Object,
			required: true
		},
		mode: {
			type: String,
			default: 'view'
		},
		locked: {
			type: Boolean
		}
	},
	emits: [ 'click-edit', 'click-lock', 'click-unlock' ],
	methods: {
		getPlayerClasses(player) {
			let ret = [];
			if (player.id === 'bye') {
				ret.push('player-name-bye')
			} else if (player.id === 'forfeit') {
				ret.push('player-name-forfeit');
			}
			if (this.locked) {
				ret.push('player-name-locked');
			}
			return ret;
		}
	}
};
</script>
