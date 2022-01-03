import _ from 'lodash';
import { createApp } from 'vue';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';

import 'bootswatch/dist/cerulean/bootstrap.min.css';
import '../public/styles.css';

import App from './App.vue';
import routeArray from './components/routes';
import CurrentTournamentLogic from './logic/current-tournament';
import GlobalModalLogic from './logic/global-modal';

let vuexConfig = {
	initialState: {},
	mutations: {},
	actions: {}
};
let stateLogicContainers = [
	CurrentTournamentLogic,
	GlobalModalLogic
];
for (let obj of stateLogicContainers) {
	for (let key in obj.state || {}) {
		if (vuexConfig.initialState[key]) console.error('Duplicate initialState key: ' + key);
		vuexConfig.initialState[key] = obj.state[key];
	}
	vuexConfig.mutations = { ...vuexConfig.mutations, ...(obj.mutations || {}) };
	vuexConfig.actions = { ...vuexConfig.actions, ...(obj.actions || {}) };
}
let store = createStore({
	state() {
		return _.cloneDeep(vuexConfig.initialState);
	},
	mutations: vuexConfig.mutations,
	actions: vuexConfig.actions
});

let router = createRouter({
	history: createWebHistory(),
	routes: [ ...routeArray ]
});

let app = createApp(App);
app.use(store);
app.use(router);

app.mount('#vue-app');
