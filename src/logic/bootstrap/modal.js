import { Collapse } from 'bootstrap';
import ComponentWrapper from './component-wrapper';

class ModalWrapper extends ComponentWrapper {

	constructor(bsInstance) {
		super(bsInstance, { disposable: true });
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

function createModal(targetEl, toggleEls) {
	let bc = new Modal(targetEl, { toggle: false });
	return new ModalWrapper(bc, toggleEls);
}

export default createCollapse;
