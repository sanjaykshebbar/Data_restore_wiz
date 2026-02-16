import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './views/Home';
import ServerWait from './views/ServerWait';
import Discovery from './views/Discovery';
import FileSelection from './views/FileSelection';

import Transfer from './views/Transfer';

function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-blue-500 selection:text-white">
      <HashRouter>
        <div className="container mx-auto p-6">
          <header className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Data Restore Wiz
            </h1>
            <div className="text-sm text-gray-500">v{window.api?.getAppVersion()}</div>
          </header>

          <main className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 min-h-[400px]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/server-wait" element={<ServerWait />} />
              <Route path="/discovery" element={<Discovery />} />
              <Route path="/file-selection" element={<FileSelection />} />
              <Route path="/transfer" element={<Transfer />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </div>
  );
}

export default App;
