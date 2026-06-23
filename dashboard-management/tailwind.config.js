const colors = require('tailwindcss/colors');

module.exports = {
    content: [
        "./src/**/*.{html,js}",
        "./src/assets/libs/*"
    ],
    safelist: [
        'bg-emerald-100',
        'bg-yellow-500',
        'text-emerald-700',
        'bg-amber-100',
        'text-amber-700',
        'inline-flex',
        'items-center',
        'px-3',
        'py-1',
        'text-xs',
        'font-semibold',
        'rounded-full',
        'dark:bg-gray-950',
        'dark:bg-blue-950',
    ],
    darkMode: ['class', '[data-mode="dark"]'],
    theme: {
        container: {
            center: true,
            padding: '1.5rem',
        },
        extend: {
            fontFamily: {
                primary: ["Outfit", "sans-serif"],
            },
            colors: {
                transperent: "transperent",
                current: "currentColor",
                muted: colors.slate[500],
                white: "#ffffff",
                light: colors.slate[100],
                black: colors.slate[600],
                purple: colors.sky[500],
                success: colors.green[500],
                danger: colors.red[500],
                warning: colors.yellow[500],
                info: colors.cyan[500],
                dark: colors.slate[900],
                darklight: "#161C30",
                darkborder: colors.slate[800],
                darkmuted: colors.slate[500],
            },
            dark: {
                50: colors.slate[50],
                100: colors.slate[100],
                200: colors.slate[200],
                300: colors.slate[300],
                400: colors.slate[400],
                500: colors.slate[500],
                600: colors.slate[600],
                700: colors.slate[700],
                800: colors.slate[800],
                850: '#161C30',
                900: colors.slate[900],
                950: colors.slate[950],
            },
            aspectRatio: {
                '4/3': '4 / 3',
                '16x9': '16 / 9',
            },
        },
    },
    plugins: [
        require("@tailwindcss/forms")({
            strategy: "base", // only generate global styles
        }),
        require("tailwind-scrollbar"),
        require('./plugins/layouts/layouts'),
        require('./plugins/layouts/sidebar'),
        require('./plugins/card'),
        require('./plugins/buttons'),
        require('./plugins/forms'),
        require('./plugins/tables'),
        require('./plugins/plugins/flatpicker'),
        require('./plugins/plugins/apexchart'),
    ],
}