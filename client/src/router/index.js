import Vue from 'vue';
import VueRouter from 'vue-router';
import ListView from '../views/List.vue';
import DocumentView from '../views/Document.vue';
import LoginView from '../views/Login.vue';
import RegisterView from '../views/Register.vue';
import UserView from '../views/User.vue';
import store from '../store';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/list' },
  { path: '/list', component: ListView },
  { path: '/document/:documentID', component: DocumentView },
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  { path: '/userpage', component: UserView },
];

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes,
});

// Setup Authentication guard
router.beforeEach((to, from, next) => {
  if (!store.state.isAuthenticated && (to.path.includes('/userpage') || to.path === '/'
    || to.path === '/list' || to.path.includes('/document'))) {
    console.info('Unauthenticated user. Redirecting to login page.');
    next('/login');
  } else if (store.state.isAuthenticated && (to.path === '/register' || to.path === '/login')) {
    next('/userpage');
  } else if (!/^((\/)|(\/list)|(\/document(\/.*)?)|(\/login)|(\/userpage)|(\/register))$/.test(to.path)) {
    // default page for nonsense paths
    console.log('nonsense path');
    next('/list');
  } else {
    next();
  }
});

export default router;
