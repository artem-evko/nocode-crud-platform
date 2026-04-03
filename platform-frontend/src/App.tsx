import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import ModelerPage from './pages/ModelerPage';
import UIBuilderPage from './pages/UIBuilderPage';
import ActionFlowPage from './pages/ActionFlowPage';
import PreviewPage from './pages/PreviewPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" theme="dark" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/modeler" element={<ModelerPage />} />
        <Route path="/projects/:projectId/builder" element={<UIBuilderPage />} />
        <Route path="/projects/:projectId/flows" element={<ActionFlowPage />} />
        <Route path="/projects/:projectId/preview" element={<PreviewPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
