<template>
	<div ref="trigger"><slot name="trigger"></slot></div>
	<div ref="target"><slot name="target"></slot></div>
</template>

<script>
import { Collapse } from 'bootstrap';

let BsCollapse = {
	name: 'BsCollapse',
	props: {
		initShown: {
			type: Boolean,
			default: false
		},
		id: {
			type: String,
			required: true
		}
	},
	mounted() {
		let trigger = this.$refs.trigger;
		let target = this.$refs.target;
		target.classList.add('collapse');
		target.setAttribute('id', this.id);
		trigger.setAttribute('data-bs-target', `#${this.id}`);
		trigger.setAttribute('data-bs-toggle', 'collapse');
		this.bc = new Collapse(target, { toggle: this.$props.initShown });
	},
	unmounted() {
		if (this.bc) this.bc.dispose();
	}
};

export default BsCollapse;
</script>
