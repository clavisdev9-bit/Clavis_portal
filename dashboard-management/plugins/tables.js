const plugin = require('tailwindcss/plugin');

module.exports = plugin(function ({ addComponents }) {
    addComponents({
        'table': {
            '@apply w-full !border-collapse': {},

            'thead': {
                '@apply border-b bg-light/40 border-slate-200 dark:bg-white/5 dark:border-darkborder': {},
            },
            ':is(thead, tbody)': {
                'tr': {
                    '@apply border-b border-slate-200 whitespace-nowrap dark:border-darkborder': {},
                },
            },
            ':is(thead, tbody, tfoot)': {
                'tr': {
                    ':is(th, td)': {
                        '@apply px-4 py-3 text-black whitespace-nowrap dark:text-white': {},
                    }
                },
            },
            'tbody': {
                'tr': {
                    '@apply last:border-0': {},
                },
            },
            '&.table-striped': {
                'tbody': {
                    'tr': {
                        '@apply even:bg-light/40 even:dark:bg-white/5': {},
                    },
                },
            },
            '&.table-hover': {
                'tbody': {
                    'tr': {
                        '@apply hover:bg-light/40 dark:hover:bg-white/5': {},
                    },
                },
            },
            '&.table-borderless': {
                ':is(thead, tbody, tfoot)': {
                    'tr': {
                        '@apply border-0': {},
                    },
                },
                'thead': {
                    '@apply border-0': {},
                },
            },
        },
    });
});
