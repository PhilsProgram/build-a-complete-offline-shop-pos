import { PwaStatus } from "./components/PwaStatus";
import { AppRoutes } from "./routes/AppRoutes";

export function App() {
  return (
    <>
      <AppRoutes />
      <PwaStatus />
    </>
  );
}
