const plugin = require('tailwindcss/plugin')

module.exports = plugin(function ({ addComponents }) {
    addComponents({
        '.apex-charts': {
            minHeight: 'auto !important',

            'text': {
                '@apply !font-primary': {},
            },

            '.apexcharts-canvas': {
                '@apply my-0 mx-auto': {}
            }
        },
        '.apexcharts-canvas': {
            '::-webkit-scrollbar-thumb': {
                '@apply bg-slate-600 shadow-md': {}
            },

            ':is(.apexcharts-reset-zoom-icon, .apexcharts-selection-icon, .apexcharts-zoom-icon)': {
                '&.apexcharts-selected': {
                    'svg': {
                        '@apply fill-purple': {}
                    }
                }
            },

            'text.apexcharts-title-text, .apexcharts-subtitle-text': {
                '@apply !fill-muted !font-medium': {},
            },
        },

        '.apexcharts-gridline': {
            '@apply stroke-black/10 dark:stroke-darkmuted': {}
        },

        '.apexcharts-ycrosshairs': {
            '@apply stroke-black/10 dark:stroke-darkmuted': {}
        },

        '.apexcharts-yaxis, .apexcharts-xaxis': {
            'text': {
                '@apply fill-muted font-primary': {}
            }
        },

        '.apexcharts-heatmap-series rect, .apexcharts-treemap-series rect': {
            '@apply stroke-white': {}
        },

        '.apexcharts-legend-text': {
            '@apply !text-muted !font-primary !text-xs': {},
        },

        '.apexcharts-xaxis-tick': {
            '@apply stroke-black/10 dark:stroke-darklight': {}
        },
        '.apexcharts-marker': {
            '@apply stroke-white': {}
        },

        '.apexcharts-tooltip': {
            '@apply shadow-lg': {},

            '&.apexcharts-theme-light': {
                '@apply dark:border-darkborder border-slate-200 bg-white dark:bg-darklight dark:text-white/80': {},
                '.apexcharts-tooltip-title': {
                    '@apply !border-b-black/10 dark:border-darkborder !bg-white !font-primary dark:!bg-darklight': {},
                }
            }
        },

        '.apexcharts-tooltip-title': {
            '@apply !font-primary': {},
        },

        '.apexcharts-pie-series, .apexcharts-bar-series': {
            'path': {
                '@apply stroke-white dark:stroke-darklight': {}
            }
        },
        '.apexcharts-menu': {
            '@apply dark:bg-darklight': {}
        },
        '.apexcharts-menu-icon svg': {
            '@apply dark:fill-darkmuted dark:hover:fill-white': {}
        },
        'apexcharts-menu-item': {
            '@apply dark:hover:bg-blue-500': {}
            // @apply hover:bg-black/5 hover:dark:bg-dark;
        },
        '.apexcharts-radialbar': {
            '.apexcharts-datalabels-group text': {
                '@apply fill-black dark:fill-white': {}
            }
        },
        '.apexcharts-radialbar-track': {
            'path': {
                '@apply stroke-black/10 dark:stroke-darkborder': {}
            }
        },

        '.apexcharts-radar-series': {
            'polygon, line': {
                '@apply fill-white dark:fill-dark stroke-black/10 dark:stroke-darkborder': {}
            }
        },

        '.apexcharts-pie': {
            'circle, line': {
                '@apply stroke-black/10 dark:stroke-darkborder': {},

                '&[fill="transparent"]': {
                    '@apply stroke-transparent': {}
                }
            },
            'text': {
                '@apply fill-white': {}
            }
        },
        '.apexcharts-xaxistooltip': {
            '&.apexcharts-theme-light': {
                '@apply shadow-md bg-white border-slate-200 dark:border-darkborder !font-primary': {},

                '&::before': {
                    '@apply border-b-black/10 dark:border-b-darkborder': {}
                }
            }
        },
        '.apexcharts-grid-borders': {
            'line': {
                '@apply stroke-black/10 dark:stroke-darkmuted': {},
            }
        },
    })
})