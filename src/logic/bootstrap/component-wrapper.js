// Base class for bootstrap js handlers, extended by each component type
class ComponentWrapper {

	constructor(bsInstance, config) {
		this.bsInstance = bsInstance;
		if (!config) config = {};
		this.disposable = !!config.disposable;
	}

	getBootstrapInstance() {
		return this.bsInstance;
	}

	reset() {
		// Nothing by default
	}

	dispose() {
		if (this.disposable) this.bsInstance.dispose();
	}

}

export default ComponentWrapper;
