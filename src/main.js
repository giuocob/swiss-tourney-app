import _ from 'lodash';
import { createApp } from 'vue';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import { createBootstrapPlugin } from './logic/bootstrap/plugin';

import 'bootswatch/dist/cerulean/bootstrap.min.css';
import '../public/styles.css';

import AppRoot from './app-root.vue';
import routeArray from './components/routes';
import TournamentLogic from './logic/tournament';
import GlobalModalLogic from './logic/global-modal';
import StorageEngine from './logic/storage/storage-engine';
import LocalStorageEngine from './logic/storage/local-storage-engine';

const STORAGE_ENGINE_TYPE = 'localstorage';

const appContext = {};

let storageEngine;
if (STORAGE_ENGINE_TYPE === 'none') {
	storageEngine = new StorageEngine();
} else if (STORAGE_ENGINE_TYPE === 'localstorage') {
	storageEngine = new LocalStorageEngine();
} else {
	throw new Error('Invalid STORAGE_ENGINE_TYPE: ' + STORAGE_ENGINE_TYPE);
}
appContext.storageEngine = storageEngine;

let vuexConfig = {
	initialState: {},
	mutations: {},
	actions: {},
	getters: {}
};
let stateLogicContainers = [
	TournamentLogic,
	GlobalModalLogic
];
for (let container of stateLogicContainers) {
	if (typeof container.vuexConfig !== 'function') continue;
	let obj = container.vuexConfig(appContext);
	for (let key in obj.state || {}) {
		if (vuexConfig.initialState[key]) console.error('Duplicate initialState key: ' + key);
		vuexConfig.initialState[key] = obj.state[key];
	}
	vuexConfig.mutations = { ...vuexConfig.mutations, ...(obj.mutations || {}) };
	vuexConfig.actions = { ...vuexConfig.actions, ...(obj.actions || {}) };
	vuexConfig.getters = { ...vuexConfig.getters, ...(obj.getters || {}) };
}
let store = createStore({
	state() {
		return _.cloneDeep(vuexConfig.initialState);
	},
	mutations: vuexConfig.mutations,
	actions: vuexConfig.actions,
	getters: vuexConfig.getters
});
store.unwrap = function(obj) {
	return JSON.parse(JSON.stringify(obj));
}

let router = createRouter({
	history: createWebHistory(),
	routes: [ ...routeArray ]
});

let bootstrapPlugin = createBootstrapPlugin();

let vueApp = createApp(AppRoot);
vueApp.use(store);
vueApp.use(router);
vueApp.use(bootstrapPlugin);
vueApp.config.globalProperties.$storageEngine = storageEngine;

vueApp.mount('#vue-app');
