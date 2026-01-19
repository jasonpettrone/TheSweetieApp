import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import Recipes from './pages/Recipes';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="recipes" element={<Recipes />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
