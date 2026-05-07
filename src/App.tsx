import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DiscoveryProvider } from "./context/DiscoveryContext";
import { ComparePage } from "./pages/ComparePage";
import { DiscoveryDashboard } from "./pages/DiscoveryDashboard";
import { FeedbackPage } from "./pages/FeedbackPage";
import { Landing } from "./pages/Landing";
import { StudioLayout } from "./pages/StudioLayout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/studio"
          element={
            <DiscoveryProvider>
              <StudioLayout />
            </DiscoveryProvider>
          }
        >
          <Route index element={<DiscoveryDashboard />} />
          <Route path="compare" element={<ComparePage />} />
          <Route path="experiments" element={<FeedbackPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
