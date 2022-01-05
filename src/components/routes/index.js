import RouteMain from './main.vue';
import RoutePlayerEntry from './player-entry.vue';
import PageNotFound from './page-not-found.vue';

export default [
	{ path: '/', component: RouteMain },
	{ path: '/player-entry', component: RoutePlayerEntry },
	{ path: '/:catchAll(.*)', component: PageNotFound }
];
