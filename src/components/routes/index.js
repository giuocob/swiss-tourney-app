import RouteMain from './main.vue';
import RoutePlayerEntry from './player-entry.vue';
import PageNotFound from './page-not-found.vue';
import RouteTournamentSetup from './tournament-setup.vue';

export default [
	{ path: '/', component: RouteMain },
	{ path: '/player-entry', component: RoutePlayerEntry },
	{ path: '/setup', component: RouteTournamentSetup },
	{ path: '/:catchAll(.*)', component: PageNotFound }
];
