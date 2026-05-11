import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CapturePage from './pages/CapturePage';
import PreviewPage from './pages/PreviewPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

  return (
    <BrowserRouter basename={basename || undefined}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/capture" element={<CapturePage />} />
        <Route path="/preview/:id" element={<PreviewPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Routes>
    </BrowserRouter>
  );
}
