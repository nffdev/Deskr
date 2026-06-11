import { lazy } from "react";

export default function useRouter() {
    const ROUTES = import.meta.glob('../../routes/**/*.jsx');

    const routes = Object.keys(ROUTES).map((route) => {
        const path = route
          	.toLowerCase()
			.split('/routes')[1]
          	.replace(/\.\/routes|index|\.jsx$/g, '')
          	.replace(/\[\.{3}.+\]/, '*')
          	.replace(/\[(.+)\]/, ':$1');

        return { path, component: lazy(ROUTES[route]) };
    });

    return routes;
}
