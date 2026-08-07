import { Routes, Route } from "react-router-dom";

import Auth from "./pages/Auth.jsx";
import Connect from "./pages/Connect.jsx";
import Chat from "./pages/Chat.jsx";

export default function App() {

    return (

        <Routes>

            <Route
                path="/"
                element={<Auth />}
            />

            <Route
                path="/connect"
                element={<Connect />}
            />

            <Route
                path="/chat"
                element={<Chat />}
            />

        </Routes>

    );

}
