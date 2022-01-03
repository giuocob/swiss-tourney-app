<template>
	<div class="mx-3">
		<div v-for="entry in entries" class="d-flex flex-row bg-primary mb-3 py-2 shadow" :key="entry.id">
			<h4 class="flex-fill text-break ps-3 mb-0">{{entry.name}}</h4>
			<button @click="deleteEntry(entry.id, $event)" class="btn btn-danger mx-3">DELETE</button>
		</div>
		<div class="d-flex flex-row bg-success mb-3 py-2" key="inputLiKey">
			<input v-model="inputName" ref="entryText" type="text" class="transparent-input flex-fill">
			<button @click="addEntry" class="input-group-btn btn btn-warning mx-3" data-bs-toggle="button">ADD</button>
		</div>
		<button @click="submitForm" class="btn btn-lg btn-success mt-4">SUBMIT</button>
	</div>
</template>

<script>
	export default {
		name: 'PeForm',
		data() {
			return {
				entries: [],
				inputName: ''
			};
		},
		emits: [ 'submit' ],
		created() {
			this.currentEntryId = 1;
		},
		methods: {
			addEntry() {
				if (this.inputName.length === 0) return;
				this.entries.push({
					id: this.currentEntryId,
					name: this.inputName
				});
				this.inputName = '';
				this.currentEntryId++;
				this.$refs.entryText.focus();
			},
			deleteEntry(entryId) {
				let deleteIndex = this.entries.findIndex((elem) => elem.id === entryId);
				if (deleteIndex !== undefined) this.entries.splice(deleteIndex, 1);
			},
			submitForm() {
				if (this.entries.length === 0) return;
				this.$emit('submit', this.entries);
			}
		},
		computed: {
			inputLiKey() {
				return `next-${this.currentEntryId}`;
			}
		}
	};
</script>
