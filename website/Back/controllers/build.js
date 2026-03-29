const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const MSBUILD_PATH = process.env.MSBUILD_PATH;

const PROJECTS = {
    cs: {
        path: path.resolve(__dirname, '../../../client_cs/client.csproj'),
        outputDir: path.resolve(__dirname, '../../../client_cs/bin/Release'),
        outputFile: 'client.exe',
        buildArgs: ['-p:Configuration=Release', '-p:Platform=AnyCPU', '-t:Rebuild']
    },
    cpp: {
        path: path.resolve(__dirname, '../../../client/client.vcxproj'),
        outputDir: path.resolve(__dirname, '../../../client/Release'),
        outputFile: 'client.exe',
        buildArgs: ['-p:Configuration=Release', '-p:Platform=Win32', '-t:Rebuild']
    }
};

exports.startBuild = async (req, res) => {
    const { appName, language } = req.body;

    if (!appName || !language) {
        return res.status(400).json({ error: 'appName and language (cs or cpp) are required.' });
    }

    const project = PROJECTS[language];
    if (!project) {
        return res.status(400).json({ error: 'Invalid language. Use "cs" or "cpp".' });
    }

    if (!fs.existsSync(project.path)) {
        return res.status(400).json({ error: `Project file not found: ${project.path}` });
    }

    if (!fs.existsSync(MSBUILD_PATH)) {
        console.log('MSBUILD_PATH value:', JSON.stringify(MSBUILD_PATH));
        return res.status(500).json({ error: 'MSBuild not found on server.' });
    }

    const io = req.app.get('io');
    const buildId = Date.now().toString();

    res.json({ buildId, message: 'Build started.' });

    io.emit('buildProgress', { buildId, progress: 5, message: 'Starting MSBuild...' });

    const nugetRestore = language === 'cs';

    if (nugetRestore) {
        io.emit('buildProgress', { buildId, progress: 10, message: 'Restoring NuGet packages...' });

        const nugetArgs = [project.path, '-t:Restore'];
        const restoreProcess = spawn(MSBUILD_PATH, nugetArgs, {
            cwd: path.dirname(project.path)
        });

        await new Promise((resolve) => {
            restoreProcess.on('close', () => resolve());
        });
    }

    io.emit('buildProgress', { buildId, progress: 20, message: 'Compiling source code...' });

    const args = [project.path, ...project.buildArgs];
    const buildProcess = spawn(MSBUILD_PATH, args, {
        cwd: path.dirname(project.path)
    });

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
            io.emit('buildProgress', {
                buildId,
                progress: 100,
                message: 'Build failed.',
                error: buildErrors || buildOutput.split('\n').filter(l => l.includes('error')).join('\n') || 'Unknown build error.',
                success: false
            });
            return;
        }

        const outputExe = path.join(project.outputDir, project.outputFile);
        if (!fs.existsSync(outputExe)) {
            io.emit('buildProgress', {
                buildId,
                progress: 100,
                message: 'Build succeeded but executable not found.',
                error: `Expected at: ${outputExe}`,
                success: false
            });
            return;
        }

        const renamedExe = path.join(project.outputDir, `${appName}.exe`);
        try {
            fs.copyFileSync(outputExe, renamedExe);
        } catch (e) { }

        const finalPath = fs.existsSync(renamedExe) ? renamedExe : outputExe;
        const stats = fs.statSync(finalPath);

        io.emit('buildProgress', {
            buildId,
            progress: 100,
            message: 'Build completed successfully!',
            success: true,
            fileSize: stats.size,
            fileName: `${appName}.exe`
        });
    });
};

exports.downloadBuild = (req, res) => {
    const { language, appName } = req.query;

    const project = PROJECTS[language];
    if (!project) {
        return res.status(400).json({ error: 'Invalid language.' });
    }

    const renamedExe = path.join(project.outputDir, `${appName}.exe`);
    const originalExe = path.join(project.outputDir, project.outputFile);
    const filePath = fs.existsSync(renamedExe) ? renamedExe : originalExe;

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Build artifact not found. Please build first.' });
    }

    res.download(filePath, `${appName || 'client'}.exe`);
};
