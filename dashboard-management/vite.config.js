import { defineConfig, loadEnv } from 'vite';
import handlebars from 'vite-plugin-handlebars';
import fs from 'fs-extra';
import { resolve } from 'path';

const path = require('path');
const glob = require('glob');

const folder = {
    src: "src/",
    src_assets: "src/assets/",
    dist: "dist/",
    dist_assets: "dist/assets/"
};

export default defineConfig(({ mode }) => {

    // ✅ WAJIB: memuat .env dari root project
    const env = loadEnv(mode, process.cwd(), '');

    return {
        // expose env ke client
        define: {
            __API_URL__: JSON.stringify(env.VITE_API_URL),
        },

        plugins: [
            handlebars({
                partialDirectory: resolve(__dirname, folder.src),
            }),
        ],

        base: '',
        clearScreen: true,

        // ⚠ ini tetap kamu gunakan
        root: path.resolve(__dirname, folder.src),

        build: {
            outDir: '../dist',
            emptyOutDir: false,

            rollupOptions: {
                manualChunks: undefined,
                input: {
                    icons: folder.src_assets + 'scss/icons.scss',
                    tailwind: folder.src_assets + 'scss/tailwind.scss',
                    pluginscustom: folder.src_assets + 'scss/plugins.scss',
                    ...generateHtmlEntries(),
                },
                output: {
                    assetFileNames: (css) => {
                        if (css.name.split('.').pop() == 'css') {
                            return 'assets/css/' + `[name]` + '.css';
                        } else if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(css.name.split('.').pop())) {
                            return 'assets/images/' + css.name;
                        } else {
                            return 'assets/css/' + css.name;
                        }
                    },
                    entryFileNames: 'assets/js/' + `[name]` + `.js`,
                },
                external: [/^assets\/libs\//],
                plugins: [
                    require('rollup-plugin-copy')({
                        targets: [
                            { src: folder.src_assets + 'images', dest: folder.dist_assets },
                            { src: folder.src_assets + 'js', dest: folder.dist_assets },
                            { src: folder.src_assets + 'php', dest: folder.dist_assets },
                        ],
                    }),
                    {
                        name: 'copy-specific-packages',
                        async writeBundle() {
                            const outputPath = path.resolve(__dirname, folder.dist_assets);
                            const outputPathSrc = path.resolve(__dirname, folder.src_assets);
                            const configPath = path.resolve(__dirname, 'package-libs-config.json');

                            try {
                                const configContent = await fs.readFile(configPath, 'utf-8');
                                const { packagesToCopy } = JSON.parse(configContent);

                                for (const packageName of packagesToCopy) {
                                    const destPackagePath = path.join(outputPath, 'libs', packageName);
                                    const destPackagePathSrc = path.join(outputPathSrc, 'libs', packageName);

                                    const sourcePath =
                                        fs.existsSync(path.join(__dirname, 'node_modules', packageName + "/dist"))
                                            ? path.join(__dirname, 'node_modules', packageName + "/dist")
                                            : path.join(__dirname, 'node_modules', packageName);

                                    try {
                                        await fs.access(sourcePath, fs.constants.F_OK);
                                        await fs.copy(sourcePath, destPackagePath);
                                        await fs.copy(sourcePath, destPackagePathSrc);
                                    } catch (error) {
                                        console.error(`Package ${packageName} does not exist.`);
                                    }
                                }
                            } catch (error) {
                                console.error('Error copying and renaming packages:', error);
                            }
                        },
                    },
                ],
            },

        },

        publicDir: 'dist',
        server: {
            host:'0.0.0.0',
            port: 8081,
            hot: true,
            proxy: {
                '/api': {
                    target: 'https://15889f846be4.ngrok-free.app/',
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    };
});

function generateHtmlEntries() {
    const entries = {};
    const htmlFiles = glob.sync('src/*.html');
    htmlFiles.forEach((file) => {
        const name = file.replace('src/', '').replace('.html', '');
        entries[name] = file;
    });
    return entries;
}
