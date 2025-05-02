import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { WeatherProvider } from './src/contexts/WeatherContext'; // Import WeatherProvider
import BottomNav from './src/screens/BottomNav';
import BottomNavAdmin from './src/screens/BottomNavAdmin';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import PilotDashboard from './src/screens/PilotDashboard';
import PilotDashboardAdmin from './src/screens/PilotDashboardAdmin';
import FlightRouteDetails from './src/screens/FlightRouteDetails';
import AlertRouteDetails from './src/screens/AlertRouteDetails';
import WeatherDetails from './src/screens/WeatherDetails';
import ChangeFlight from './src/screens/ChangeFlight';
import Forecast from './src/screens/Forecast';
import IncidentReportScreen from './src/screens/IncidentReportScreen';
import FlightRoute from './src/screens/FlightRoute';
import FlightRouteAdmin from './src/screens/FlightRouteAdmin';
import FlightBooking from './src/screens/FlightBooking';
import MyBookings from './src/screens/MyBookings';
import Header from './src/screens/Header';
import Chatbot from './src/components/Chatbot'; // Import Chatbot

const Stack = createNativeStackNavigator();

export default function App() {
  const [currentRoute, setCurrentRoute] = useState('Home');

  return (
    <AuthProvider>
      <WeatherProvider>
        <NavigationContainer
          onStateChange={(state) => {
            const route = state.routes[state.index];
            setCurrentRoute(route.name);
          }}
        >
          <NavigationContent currentRoute={currentRoute} />
        </NavigationContainer>
      </WeatherProvider>
    </AuthProvider>
  );
}

function NavigationContent({ currentRoute }) {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase();

  const hideBottomNavRoutes = ['Splash', 'Login', 'Home'];
  const hideHeaderRoutes = ['Splash', 'Login', 'Home'];
  const hideChatbotRoutes = ['Splash', 'Login', 'Home']; // Không hiển thị Chatbot ở các trang này

  const customerRoutes = [
    'PilotDashboard',
    'FlightBooking',
    'FlightRouteAdmin',
    'MyBookings',
    'FlightRoute',
  ];

  const adminRoutes = [
    'PilotDashboardAdmin',
    'FlightRouteAdmin',
    'AlertRouteDetails',
    'WeatherDetails',
    'ChangeFlight',
    'Forecast',
    'IncidentReportScreen',
  ];

  const showBottomNav = role === 'user' && customerRoutes.includes(currentRoute);
  const showBottomNavAdmin = role === 'admin' && adminRoutes.includes(currentRoute);

  return (
    <>
      {!hideHeaderRoutes.includes(currentRoute) && <Header />}
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
        <Stack.Screen name="FlightBooking" component={FlightBooking} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PilotDashboard" component={PilotDashboard} />
        <Stack.Screen name="PilotDashboardAdmin" component={PilotDashboardAdmin} />
        <Stack.Screen name="FlightRouteDetails" component={FlightRouteDetails} />
        <Stack.Screen name="FlightRoute" component={FlightRoute} />
        <Stack.Screen name="MyBookings" component={MyBookings} />
        <Stack.Screen name="FlightRouteAdmin" component={FlightRouteAdmin} />
        <Stack.Screen name="AlertRouteDetails" component={AlertRouteDetails} />
        <Stack.Screen name="WeatherDetails" component={WeatherDetails} />
        <Stack.Screen name="ChangeFlight" component={ChangeFlight} />
        <Stack.Screen name="Forecast" component={Forecast} />
        <Stack.Screen name="IncidentReportScreen" component={IncidentReportScreen} />
      </Stack.Navigator>

      {!hideBottomNavRoutes.includes(currentRoute) && (
        <>
          {showBottomNav && <BottomNav />}
          {showBottomNavAdmin && <BottomNavAdmin />}
        </>
      )}

      {/* Hiển thị Chatbot trừ các trang trong hideChatbotRoutes */}
      {!hideChatbotRoutes.includes(currentRoute) && <Chatbot />}
    </>
  );
}