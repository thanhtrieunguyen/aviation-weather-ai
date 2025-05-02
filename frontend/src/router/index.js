import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import WeatherManagement from '../views/WeatherManagement.vue'
import AlertsManagement from '../views/AlertsManagement.vue'
import FlightManagement from '../views/FlightManagement.vue'
import ReportsManagement from '../views/ReportsManagement.vue'
import UserManagement from '../views/UserManagement.vue'
import AlertsfFlights from '../views/Alertsflights.vue'
import Login from '../views/Login.vue'
import ProfileModal from '../components/ProfileModal.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }, // Yêu cầu xác thực
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../components/DashboardHome.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'weather',
        name: 'WeatherManagement',
        component: WeatherManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'alerts',
        name: 'AlertsManagement',
        component: AlertsManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'flights',
        name: 'FlightManagement',
        component: FlightManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'reports',
        name: 'ReportsManagement',
        component: ReportsManagement,
        meta: { requiresAuth: true }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: UserManagement,
        meta: { requiresAuth: true }
      },
      {
        path: '/profile',
        name: 'Profile',
        component: ProfileModal,
        meta: { requiresAuth: true }
      },
      {
        path: '/alertsflights',
        name: 'Alertsflights',
        component: AlertsfFlights, 
        meta: { requiresAuth: true }
      },
    ]
  },

  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/login' // Đường dẫn không tồn tại sẽ chuyển về trang login
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard kiểm tra đăng nhập
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!localStorage.getItem('userToken'); // Kiểm tra token xác thực
  if (to.meta.requiresAuth && !isLoggedIn) {
    next('/login'); // Nếu không có token, chuyển hướng về trang login
  } else if (isLoggedIn && to.name === 'Login') {
    next('/'); // Nếu người dùng đã đăng nhập và cố gắng vào trang login, chuyển hướng đến Dashboard
  } else {
    next(); // Cho phép truy cập nếu đã đăng nhập hoặc không yêu cầu xác thực
  }
});


export default router
