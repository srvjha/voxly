import { Route, Routes } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Home } from "@/pages/Home";
import { Dashboard } from "@/pages/Dashboard";
import { PollBuilder } from "@/pages/PollBuilder";
import { PollManage } from "@/pages/PollManage";
import { Analytics } from "@/pages/Analytics";
import { PollPublic } from "@/pages/PollPublic";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/p/:id" element={<PollPublic />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polls/new"
          element={
            <ProtectedRoute>
              <PollBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polls/:id/edit"
          element={
            <ProtectedRoute>
              <PollBuilder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polls/:id/manage"
          element={
            <ProtectedRoute>
              <PollManage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polls/:id/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
