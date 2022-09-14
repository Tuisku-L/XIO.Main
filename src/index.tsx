import React from "react";
import ReactDOM from "react-dom";
import { HashRouter } from "react-router-dom";
import Routers from "./router";

import "./global.less";

ReactDOM.render(
    <HashRouter>
        <Routers />
    </HashRouter>
    , document.getElementById("app"));
