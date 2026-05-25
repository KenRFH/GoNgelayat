import "../css/app.css";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import React from "react";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

createInertiaApp({
    resolve: (name) => {
        // Pages berada di resources/js/pages/**/*.tsx
        const pages = import.meta.glob("./pages/**/*.tsx", { eager: true }) as Record<
            string,
            { default: React.ComponentType }
        >;
        const page = pages[`./pages/${name}.tsx`];
        if (!page) throw new Error(`Page "./pages/${name}.tsx" not found. Available: ${Object.keys(pages).join(", ")}`);
        return page.default;
    },
    setup({ el, App, props }) {
        createRoot(el!).render(<App {...props} />);
    },
});
