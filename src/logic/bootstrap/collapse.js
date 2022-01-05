import { Collapse } from 'bootstrap';
import ComponentWrapper from './component-wrapper';

class CollapseWrapper extends ComponentWrapper {

	constructor(bsInstance, toggleEls=[]) {
		super(bsInstance, { disposable: true });
		this.toggleEls = Array.isArray(toggleEls) ? toggleEls : [ toggleEls ];
		for (let el of this.toggleEls) {
			el.addEventListener('click', () => this.toggle());
		}
	}

	reset() {
		return this.hide();
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
	return new CollapseWrapper(bc, toggleEls);
}

export default createCollapse;
