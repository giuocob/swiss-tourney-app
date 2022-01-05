import createCollapse from './collapse';

function createBootstrapPlugin() {

	function wrapCreateFn(createFn) {
		return function(vm, ...createFnArgs) {
			let handler = createFn(...createFnArgs);
			vm.$bootstrapState.handlers.push(handler);
			if (!vm.$bootstrapState.handlers.watchingRouteChange) {
				vm.$watch('$route', function(newVal, oldVal) {
					if (newVal && oldVal && (newVal.path !== oldVal.path)) {
						for (let handler of vm.$bootstrapState.handlers) {
							handler.reset();
						}
					}
				});
			}
		}
	}

	let globalPluginObj = {
		addCollapse: wrapCreateFn(createCollapse)
	};

	let mixin = {
		created() {
			this.$bootstrapState = {
				handlers: [],
				watchingRouteChange: false
			};
		},
		unmounted() {
			for (let handler of this.$bootstrapState.handlers) {
				handler.dispose();
			}
		}
	};

	return {
		install(Vue, opts) {
			Vue.config.globalProperties.$bootstrap = globalPluginObj;
			Vue.mixin(mixin);
		}
	};
}

export { createBootstrapPlugin };
