import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

// no-param-reassign prevents store.isAuthenticated = isAuthenticated
/* eslint-disable no-param-reassign */
export default new Vuex.Store({
  state: {
    isAuthenticated: false,
    currentUser: '',
  },
  mutations: {
    setIsAuthenticated(store, isAuthenticated) {
      store.isAuthenticated = isAuthenticated;
    },
    setCurrentUser(store, user) {
      store.currentUser = user;
    },
  },
  actions: {
  },
  modules: {
  },
});
