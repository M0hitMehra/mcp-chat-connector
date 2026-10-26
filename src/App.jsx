import { Routes, Route } from "react-router-dom";

import Auth from "./pages/Auth.jsx";
import Chat from "./pages/Chat.jsx";
import Pitch from "./pages/Pitch.jsx";
import Management from "./pages/Management.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Auth />} />

      <Route path="/chat" element={<Chat />} />

      <Route path="/pitch" element={<Pitch />} />

      <Route path="/manage" element={<Management />} />
    </Routes>
  );
}
