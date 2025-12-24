// routes/index.ts
import { AuthRoutes } from "@/app/auth/auth.route";
import CacheRoutes from "@/app/cache/cache.route";
import { UsersRoutes } from "../app/users/users.route";

import { DependentRoutes } from "@/app/dependent/dependent.route";
import { DoseRoutes } from "@/app/dose/dose.route";
import { MedicineHistoryRoutes } from "@/app/medicine-history/medicine-history.route";
import { NotificationRoutes } from "@/app/notifications/notifications.route";
import express from "express";
const routes = express();

const routeModules: RouteModule = [
  {
    path: "/users",
    route: UsersRoutes,
  },

  {
    path: "/auth/otp",
    route: AuthRoutes,
  },

  {
    path: "/cache",
    route: CacheRoutes,
  },

  {
    path: "/dependents",
    route: DependentRoutes,
  },

  {
    path: "/doses",
    route: DoseRoutes,
  },

  {
    path: "/medicine-history",
    route: MedicineHistoryRoutes,
  },

  {
    path: "/notifications",
    route: NotificationRoutes,
  },
];

routeModules.forEach(({ path, route }) => {
  routes.use(path, route);
});

export default routes;

export type RouteModule = {
  path: string;
  route: express.Router;
}[];
