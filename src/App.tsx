import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CharacterView from './pages/CharacterView';
import BattleArena from './pages/BattleArena';
import Battle from './pages/Battle';
import Store from './pages/Store';
import OpenChest from './pages/OpenChest';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" /> : <Signup />}
        />
        <Route
          path="/"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/characters/:id"
          element={isAuthenticated ? <CharacterView /> : <Navigate to="/login" />}
        />
        <Route
          path="/arena"
          element={isAuthenticated ? <BattleArena /> : <Navigate to="/login" />}
        />
        <Route
          path="/arena/battle/:opponentId"
          element={isAuthenticated ? <Battle /> : <Navigate to="/login" />}
        />
        <Route
          path="/store"
          element={isAuthenticated ? <Store /> : <Navigate to="/login" />}
        />
        <Route
          path="/open-chest/:type"
          element={isAuthenticated ? <OpenChest /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;