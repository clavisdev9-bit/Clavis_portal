const plugin = require('tailwindcss/plugin');

module.exports = plugin(function ({ addComponents }) {
    addComponents({
        '.card': {
            '@apply p-5 bg-white border rounded border-slate-200 dark:bg-darklight dark:border-darkborder shadow-lg shadow-slate-200/50 dark:shadow-slate-800/30': {},
        },
    });
});
