<template>
	<div class="mx-3">
		<h1 class="text-center">PARTICIPANTS!!!</h1>
		<div v-for="entry in participants" class="w-100 d-flex bg-success mb-3 py-2 shadow" :key="entry.id">
			<h4 class="text-break ps-3">{{entry.name}}</h4>
		</div>
	</div>
</template>

<script>
	export default {
		name: 'ParticipantDisplay',
		created() {
			this.currentEntryId = 1;
		},
		computed: {
			participants() {
				if (!this.$store.state.participants) return [];
				return this.$store.state.participants;
			}
		}
	};
</script>
