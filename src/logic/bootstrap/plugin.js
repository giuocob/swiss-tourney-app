import createCollapse from './collapse';
import createModal from './modal';

function createBootstrapPlugin() {

	function wrapCreateFn(createFn) {
		return function(vm, ...createFnArgs) {
			let handler = createFn(...createFnArgs);
			vm.$bootstrapState.handlers.push(handler);
			if (!vm.$bootstrapState.watchingRouteChange) {
				vm.$watch('$route', function(newVal, oldVal) {
					if (newVal && oldVal && (newVal.path !== oldVal.path)) {
						for (let handler of vm.$bootstrapState.handlers) {
							handler.reset();
						}
					}
				});
				vm.$bootstrapState.watchingRouteChange = true;
			}
			return handler;
		}
	}

	let globalPluginObj = {
		addCollapse: wrapCreateFn(createCollapse),
		addModal: wrapCreateFn(createModal)
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
