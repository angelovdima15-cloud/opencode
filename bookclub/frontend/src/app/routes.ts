import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { AuthScreen } from "./components/screens/AuthScreen";
import { HomeScreen } from "./components/screens/HomeScreen";
import { ClubProfileScreen } from "./components/screens/ClubProfileScreen";
import { BookingScreen } from "./components/screens/BookingScreen";
import { PaymentScreen } from "./components/screens/PaymentScreen";
import { MyBookingsScreen } from "./components/screens/MyBookingsScreen";
import { ProfileScreen } from "./components/screens/ProfileScreen";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: AuthScreen,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomeScreen },
      { path: "club/:clubId", Component: ClubProfileScreen },
      { path: "club/:clubId/book", Component: BookingScreen },
      { path: "club/:clubId/book/payment", Component: PaymentScreen },
      { path: "bookings", Component: MyBookingsScreen },
      { path: "profile", Component: ProfileScreen },
    ],
  },
]);
