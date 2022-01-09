import { Collapse } from 'bootstrap';
import ComponentWrapper from './component-wrapper';

class CollapseWrapper extends ComponentWrapper {

	constructor(bsInstance, targetEl, toggleEls=[]) {
		super(bsInstance, { disposable: true });
		this.targetEl = targetEl;
		this.toggleEls = Array.isArray(toggleEls) ? toggleEls : [ toggleEls ];

		this.targetEl.addEventListener('hidden.bs.collapse', () => {
			this.targetEl.classList.remove('collapsing-no-animation');
		});
		for (let el of this.toggleEls) {
			el.addEventListener('click', () => this.toggle());
		}
	}

	reset() {
		this.targetEl.classList.add('collapsing-no-animation');
		return this.bsInstance.hide();
	}

	show() {
		return this.bsInstance.show();
	}

	hide() {
		return this.bsInstance.hide();
	}

	toggle() {
		return this.bsInstance.toggle();
	}

}

function createCollapse(targetEl, toggleEls) {
	let bc = new Collapse(targetEl, { toggle: false });
	return new CollapseWrapper(bc, targetEl, toggleEls);
}

export default createCollapse;
