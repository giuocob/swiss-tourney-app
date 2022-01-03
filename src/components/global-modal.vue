<template>
	<div ref="modalDiv" class="modal fade" tabindex="-1">
	  <div class="modal-dialog">
	    <div class="modal-content">
	      <div class="modal-body">
	        <p>{{message}}</p>
	      </div>
	      <div v-if="mode === 'info'" class="modal-footer">
	        <button @click="close" type="button" class="btn btn-primary">OK</button>
				</div>
				<div v-else-if="mode === 'areYouSure'" class="modal-footer">
					<button @click="close" type="button" class="btn btn-secondary">Cancel</button>
					<button @click="handleSubmit" type="button" class ="btn btn-primary">OK</button>
				</div>
	    </div>
	  </div>
	</div>
</template>

<script>
import { Modal } from 'bootstrap';

export default {
	name: 'GlobalModal',
	data() {
		return { bmIsShown: false }
	},
	props: {
		shown: {
			type: Boolean,
			default: 'false'
		},
		mode: {
			type: String,  // one of [ 'info', 'areYouSure' ],
			default: 'info'
		},
		message: {
			type: String
		},
		submitAction: Object
	},
	mounted() {
		let md = this.getModalDiv();
		this.bm = new Modal(md);
		this.bmShown = false;
		md.addEventListener('hidden.bs.modal', () => {
			// Reinstate the fade class if we removed it
			md.classList.add('fade');
		});
	},
	unmounted() {
		if (this.bm) this.bm.dispose();
	},
	watch: {
		shown: function(newShown) {
			if (newShown && !this.bmIsShown) {
				this.bm.show();
				this.bmIsShown = true;
			} else if (!newShown && this.bmIsShown) {
				this.bm.hide();
				this.bmIsShown = false;
			}
		}
	},
	methods: {
		getModalDiv() {
			return this.$refs.modalDiv;
		},
		close() {
			this.bm.hide();
			this.bmIsShown = false;
			this.$store.commit('hideGlobalModal');
		},
		handleSubmit() {
			let action = this.submitAction && this.submitAction.action;
			if (action === 'redirect') {
				this.$router.push(this.submitAction.link);
				// Remove fade to make modal pop out immediately
				this.getModalDiv().classList.remove('fade');
				this.close();
			} else {
				this.close();
			}
		}
	}
};
</script>
