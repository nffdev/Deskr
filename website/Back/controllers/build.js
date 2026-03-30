const { spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const BUILD_ENGINE = process.env.BUILD_ENGINE || 'msbuild';
const BUILD_PATH = process.env.BUILD_PATH || process.env.MSBUILD_PATH;
const BUILDER_DIR = path.resolve(__dirname, '../../../builder');

const TEMPLATES = {
    cs: {
        source: path.join(BUILDER_DIR, 'scripts/cs'),
        projectFile: 'client.csproj',
        outputDir: 'bin/Release',
        outputFile: 'client.exe',
        configFile: 'Helpers/Constants.cs',
        msbuild: {
            buildArgs: ['-p:Configuration=Release', '-p:Platform=AnyCPU', '-t:Rebuild'],
            restoreArgs: ['-t:Restore']
        },
        dotnet: {
            buildArgs: ['build', '--configuration', 'Release'],
            restoreArgs: ['restore']
        }
    },
    cpp: {
        source: path.join(BUILDER_DIR, 'scripts/cpp'),
        projectFile: 'client.vcxproj',
        outputDir: 'Release',
        outputFile: 'client.exe',
        configFile: 'helpers/constants.h',
        msbuild: {
            buildArgs: ['-p:Configuration=Release', '-p:Platform=Win32', '-t:Rebuild'],
            restoreArgs: []
        },
        dotnet: {
            buildArgs: ['build', '--configuration', 'Release', '/p:Platform=Win32'],
            restoreArgs: ['restore']
        }
    }
};


function generateBuildId() {
    return crypto.randomBytes(8).toString('hex');
}

function copyDirSync(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

function injectConfig(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf-8');
    for (const [key, value] of Object.entries(replacements)) {
        content = content.replace(key, value);
    }
    fs.writeFileSync(filePath, content);
}

function writeConfigFile(buildId, config) {
    const configPath = path.join(BUILDER_DIR, 'configs', buildId);
    const lines = [
        config.appName || 'DeskrClient',
        config.description || 'Deskr Remote Desktop Client',
        config.copyright || '',
        config.version || '1.0.0',
        config.icon || 'default',
        config.apiUrl || 'http://localhost:8080/api',
        config.language || 'cs'
    ];
    fs.writeFileSync(configPath, lines.join('\n'));
}

exports.uploadIcon = (req, res) => {
    const { id, data } = req.body;
    if (!id || !data) {
        return res.status(400).json({ error: 'Icon id and base64 data are required.' });
    }

    try {
        const buffer = Buffer.from(data, 'base64');
        const iconPath = path.join(BUILDER_DIR, 'icons', `${id}.ico`);
        fs.writeFileSync(iconPath, buffer);
        res.json({ success: true, iconId: id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save icon.' });
    }
};

exports.startBuild = async (req, res) => {
    const { appName, language, version, description, copyright, icon, apiUrl } = req.body;

    if (!appName || !language) {
        return res.status(400).json({ error: 'appName and language (cs or cpp) are required.' });
    }

    const template = TEMPLATES[language];
    if (!template) {
        return res.status(400).json({ error: 'Invalid language. Use "cs" or "cpp".' });
    }

    if (!BUILD_PATH) {
        return res.status(500).json({ error: 'Build tool path not configured.' });
    }

    const buildId = generateBuildId();
    const io = req.app.get('io');

    res.json({ buildId, message: 'Build started.' });

    io.emit('buildProgress', { buildId, progress: 5, message: 'Preparing build environment...' });

    const buildScriptDir = path.join(BUILDER_DIR, 'scripts', buildId);
    const buildOutputDir = path.join(BUILDER_DIR, 'builds', buildId);

    try {
        copyDirSync(template.source, buildScriptDir);
        fs.mkdirSync(buildOutputDir, { recursive: true });

        io.emit('buildProgress', { buildId, progress: 10, message: 'Injecting configuration...' });

        const configFilePath = path.join(buildScriptDir, template.configFile);
        injectConfig(configFilePath, {
            '%BASE_API%': apiUrl || 'http://localhost:8080/api'
        });

        writeConfigFile(buildId, { appName, description, copyright, version, icon, apiUrl, language });

        if (icon && icon !== 'default') {
            const iconSrc = path.join(BUILDER_DIR, 'icons', `${icon}.ico`);
            if (fs.existsSync(iconSrc)) {
                const iconDest = path.join(buildScriptDir, 'app.ico');
                fs.copyFileSync(iconSrc, iconDest);
            }
        }

        io.emit('buildProgress', { buildId, progress: 15, message: 'Restoring packages...' });

        const engineConfig = template[BUILD_ENGINE];
        const projectFilePath = path.join(buildScriptDir, template.projectFile);

        if (engineConfig.restoreArgs.length > 0) {
            const restoreArgs = BUILD_ENGINE === 'msbuild'
                ? [projectFilePath, ...engineConfig.restoreArgs]
                : [...engineConfig.restoreArgs, projectFilePath];
            const restoreProcess = spawn(BUILD_PATH, restoreArgs, { cwd: buildScriptDir });
            await new Promise((resolve) => restoreProcess.on('close', () => resolve()));
        }

        io.emit('buildProgress', { buildId, progress: 20, message: 'Compiling source code...' });

        const buildArgs = BUILD_ENGINE === 'msbuild'
            ? [projectFilePath, ...engineConfig.buildArgs]
            : [...engineConfig.buildArgs, projectFilePath];
        const buildProcess = spawn(BUILD_PATH, buildArgs, { cwd: buildScriptDir });

        let buildOutput = '';
        let buildErrors = '';

        buildProcess.stdout.on('data', (data) => {
            const text = data.toString();
            buildOutput += text;

            if (text.includes('Compiling') || text.includes('CoreCompile') || text.includes('Csc') || text.includes('ClCompile')) {
                io.emit('buildProgress', { buildId, progress: 40, message: 'Compiling source files...' });
            } else if (text.includes('Link') || text.includes('GenerateTargetFrameworkMonikerAttribute') || text.includes('ResolveAssemblyReference')) {
                io.emit('buildProgress', { buildId, progress: 60, message: 'Linking dependencies...' });
            } else if (text.includes('CopyFilesToOutputDirectory') || text.includes('Copie du fichier') || text.includes('_CopyOutOfDateSourceItemsToOutputDirectory')) {
                io.emit('buildProgress', { buildId, progress: 80, message: 'Copying output files...' });
            }
        });

        buildProcess.stderr.on('data', (data) => {
            buildErrors += data.toString();
        });

        buildProcess.on('close', (code) => {
            if (code !== 0) {
                try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

                io.emit('buildProgress', {
                    buildId,
                    progress: 100,
                    message: 'Build failed.',
                    error: buildErrors || buildOutput.split('\n').filter(l => l.includes('error')).join('\n') || 'Unknown build error.',
                    success: false
                });
                return;
            }

            const outputExe = path.join(buildScriptDir, template.outputDir, template.outputFile);
            if (!fs.existsSync(outputExe)) {
                try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

                io.emit('buildProgress', {
                    buildId,
                    progress: 100,
                    message: 'Build succeeded but executable not found.',
                    error: `Expected at: ${outputExe}`,
                    success: false
                });
                return;
            }

            const finalExe = path.join(buildOutputDir, `${appName}.exe`);
            fs.copyFileSync(outputExe, finalExe);

            try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

            const stats = fs.statSync(finalExe);

            io.emit('buildProgress', {
                buildId,
                progress: 100,
                message: 'Build completed successfully!',
                success: true,
                fileSize: stats.size,
                fileName: `${appName}.exe`
            });
        });

    } catch (err) {
        try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

        io.emit('buildProgress', {
            buildId,
            progress: 100,
            message: 'Build failed.',
            error: err.message,
            success: false
        });
    }
};

exports.downloadBuild = (req, res) => {
    const { buildId, appName } = req.query;

    if (!buildId || !appName) {
        return res.status(400).json({ error: 'buildId and appName are required.' });
    }

    const filePath = path.join(BUILDER_DIR, 'builds', buildId, `${appName}.exe`);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Build artifact not found.' });
    }

    res.download(filePath, `${appName}.exe`);
};
