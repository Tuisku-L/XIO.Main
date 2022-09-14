import React from "react";
import { Routes, Route } from "react-router-dom";

import Main from "@/pages/main";
import List from "@/pages/list";

const router = () => (
    <>
        <div>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/list" element={<List />} />
            </Routes>
        </div>
    </>
);

export default router;
