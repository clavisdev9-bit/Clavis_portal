const plugin = require('tailwindcss/plugin')

module.exports = plugin(function ({ addBase, theme }) {
    addBase({
        'h1': { fontSize: theme('fontSize.4xl'), fontWeight: theme('fontWeight.semibold') },
        'h2': { fontSize: theme('fontSize.3xl'), fontWeight: theme('fontWeight.semibold') },
        'h3': { fontSize: theme('fontSize.2xl'), fontWeight: theme('fontWeight.semibold') },
        'h4': { fontSize: theme('fontSize.xl'), fontWeight: theme('fontWeight.semibold') },
        'h5': { fontSize: theme('fontSize.lg'), fontWeight: theme('fontWeight.semibold') },
        'h6': { fontSize: theme('fontSize.base'), fontWeight: theme('fontWeight.semibold') },
    })
})