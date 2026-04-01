import { BrowserRouter, Routes, Route } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { NewEntry } from './pages/NewEntry';
import { Library } from './pages/Library';
import { ContentViewer } from './pages/ContentViewer';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<NewEntry />} />
          <Route path="library" element={<Library />} />
          <Route path="library/:id" element={<ContentViewer />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
