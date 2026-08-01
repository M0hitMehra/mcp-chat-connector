import { Routes, Route } from "react-router-dom";

import Connect from "./pages/Connect.jsx";
import Chat from "./pages/Chat.jsx";

export default function App() {

    return (

        <Routes>

            <Route
                path="/"
                element={<Connect />}
            />

            <Route
                path="/chat"
                element={<Chat />}
            />

        </Routes>

    );

}