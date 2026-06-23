const plugin = require('tailwindcss/plugin');

module.exports = plugin(function ({ addComponents }) {
    addComponents({
        '.form-input, .form-textarea,.form-select,.form-multiselect': {
            '@apply w-full border border-slate-200 rounded bg-[#f9fbfd] dark:bg-dark dark:border-darkborder dark:placeholder:text-darkmuted dark:text-white dark:focus:border-purple text-black h-12 focus:!shadow-none focus:border-purple focus:ring-0 placeholder:text-black/50': {},
        },
        '.form-radio, .form-checkbox': {
            '@apply size-5 cursor-pointer rounded border-2 border-slate-200 dark:border-darkmuted dark:checked:border-transparent bg-transparent text-purple checked:border-transparent !shadow-none !outline-none !ring-0 !ring-offset-0 checked:bg-[length:90%_90%] disabled:cursor-not-allowed disabled:bg-transparent disabled:!border-2 disabled:!border-slate-200 dark:disabled:!border-darkmuted ltr:mr-1.5 rtl:ml-1.5 hover:disabled:bg-muted hover:disabled:checked:bg-transparent': {},
        },
        '.form-checkbox': {
            '&.outborder-purple:checked': {
                '@apply !border-purple bg-transparent': {},
                backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='%236a69f5' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`
            },
            '&.outborder-info:checked': {
                '@apply !border-info bg-transparent': {},
                backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='%23009ef7' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`
            },
            '&.outborder-success:checked': {
                '@apply !border-success bg-transparent': {},
                backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='%2350cd89' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`
            },
            '&.outborder-warning:checked': {
                '@apply !border-warning bg-transparent': {},
                backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='%23ffc700' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`
            },
            '&.outborder-danger:checked': {
                '@apply !border-danger bg-transparent': {},
                backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='%23f1416c' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`
            },
            '&.outborder-black:checked': {
                '@apply !border-black bg-transparent': {},
                backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='%23323a46' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`
            },
            '&.outborder-muted:checked': {
                '@apply !border-muted bg-transparent': {},
                backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 16 16' fill='%2394989a' xmlns='http://www.w3.org/2000/svg'><path d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/></svg>")`
            }
        },
        '.form-radio': {
            '@apply rounded-full': {},
            '&.outborder-purple:checked' :{
                '@apply bg-transparent border-purple bg-none': {},
            },
            '&.outborder-info:checked' :{
                '@apply bg-transparent border-info bg-none': {},
            },
            '&.outborder-success:checked' :{
                '@apply bg-transparent border-success bg-none': {},
            },
            '&.outborder-danger:checked' :{
                '@apply bg-transparent border-danger bg-none': {},
            },
            '&.outborder-warning:checked' :{
                '@apply bg-transparent border-warning bg-none': {},
            },
            '&.outborder-black:checked' :{
                '@apply bg-transparent border-black bg-none': {},
            },
            '&.outborder-muted:checked' :{
                '@apply bg-transparent border-muted bg-none': {},
            }
        },
        //SWITCHES
        '.togglebutton input:checked ~ .band' :{
            '@apply bg-purple': {},
        },
        '.togglebutton input:checked ~ .dot' :{
            '@apply translate-x-full bg-white': {},
        },
        '.togglebutton.out-line input:checked ~ .band' :{
            '@apply bg-transparent border-purple': {},
        },
        '.togglebutton.out-line input:checked ~ .dot' :{
            '@apply translate-x-full bg-purple': {},
        }
    });
});
