'use client'

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import { Package, FileCode, Download, Check, Loader2, AlertCircle, Upload, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BASE_API, API_VERSION } from "../../config.json";
import io from 'socket.io-client';

export default function Builder() {
  const { user } = useAuth();
  const [buildStep, setBuildStep] = useState('config');
  const [buildConfig, setBuildConfig] = useState({
    appName: '',
    version: '1.0.0',
    language: 'cs',
    description: '',
    copyright: '',
    apiUrl: '',
    icon: null,
    iconId: null,
  });
  const [buildStatus, setBuildStatus] = useState({
    progress: 0,
    message: '',
    error: null,
    buildTime: null,
    fileSize: null,
    fileName: null,
    success: null
  });
  const [iconPreview, setIconPreview] = useState(null);
  const socketRef = useRef(null);
  const buildIdRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const socket = io(BASE_API.replace('/api', ''), {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('buildProgress', (data) => {
      if (buildIdRef.current && data.buildId === buildIdRef.current) {
        setBuildStatus(prev => ({
          ...prev,
          progress: data.progress,
          message: data.message,
          error: data.error || null
        }));

        if (data.progress === 100) {
          const endTime = new Date();
          const buildTime = ((endTime - startTimeRef.current) / 1000).toFixed(1);

          setBuildStatus(prev => ({
            ...prev,
            buildTime,
            fileSize: data.fileSize,
            fileName: data.fileName,
            success: data.success
          }));

          setBuildStep(data.success ? 'complete' : 'error');
        }
      }
    });

    return () => socket.disconnect();
  }, []);

  const manageConfigChange = (field, value) => {
    setBuildConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleIconSelect = async (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      setIconPreview(e.target.result);
      const base64 = e.target.result.split(',')[1];
      const iconId = Date.now().toString(16);
      try {
        const token = localStorage.getItem('token');
        await fetch(`${BASE_API}/v${API_VERSION}/build/upload/icon`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ id: iconId, data: base64 })
        });
        manageConfigChange('iconId', iconId);
        manageConfigChange('icon', file);
      } catch (err) {
        console.error('Failed to upload icon:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const startBuild = async () => {
    if (!buildConfig.appName) {
      alert("Le nom de l'application est requis");
      return;
    }

    setBuildStep('building');
    startTimeRef.current = new Date();
    setBuildStatus({ progress: 0, message: 'Initialisation du build...', error: null, buildTime: null, fileSize: null, fileName: null, success: null });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_API}/v${API_VERSION}/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          appName: buildConfig.appName,
          language: buildConfig.language,
          version: buildConfig.version,
          description: buildConfig.description,
          copyright: buildConfig.copyright,
          apiUrl: buildConfig.apiUrl || undefined,
          icon: buildConfig.iconId || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setBuildStatus(prev => ({ ...prev, error: data.error || 'Build failed to start.', message: 'Build failed.' }));
        setBuildStep('error');
        return;
      }
      buildIdRef.current = data.buildId;
    } catch (err) {
      setBuildStatus(prev => ({ ...prev, error: err.message, message: 'Failed to connect to build server.' }));
      setBuildStep('error');
    }
  };

  const downloadBuild = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_API}/v${API_VERSION}/build/download?buildId=${buildIdRef.current}&appName=${encodeURIComponent(buildConfig.appName)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${buildConfig.appName}.exe`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetBuilder = () => {
    setBuildStep('config');
    buildIdRef.current = null;
    setIconPreview(null);
    setBuildStatus({ progress: 0, message: '', error: null, buildTime: null, fileSize: null, fileName: null, success: null });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 sm:pb-20 overflow-y-auto">
      <header className="p-3 sm:p-4 bg-white">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="min-w-0">
            <h1 className="font-medium text-sm sm:text-base">Application Builder</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500">Build executable files</span>
              <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-blue-500 text-white rounded">Beta</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        {buildStep === 'config' && (
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <h2 className="font-medium text-base sm:text-lg mb-3 sm:mb-4">General</h2>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Application Name</label>
                  <input type="text" value={buildConfig.appName} onChange={(e) => manageConfigChange('appName', e.target.value)} placeholder="My Application" className="w-full p-2 text-sm sm:text-base border rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Version</label>
                    <input type="text" value={buildConfig.version} onChange={(e) => manageConfigChange('version', e.target.value)} placeholder="1.0.0" className="w-full p-2 text-sm sm:text-base border rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1">Copyright</label>
                    <input type="text" value={buildConfig.copyright} onChange={(e) => manageConfigChange('copyright', e.target.value)} placeholder="2026 MyCompany" className="w-full p-2 text-sm sm:text-base border rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
                  <input type="text" value={buildConfig.description} onChange={(e) => manageConfigChange('description', e.target.value)} placeholder="Remote desktop client" className="w-full p-2 text-sm sm:text-base border rounded-lg" />
                </div>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <h2 className="font-medium text-base sm:text-lg mb-3 sm:mb-4">Configuration</h2>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Language</label>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button onClick={() => manageConfigChange('language', 'cs')} className={`p-2 sm:p-3 border rounded-lg text-center transition-all ${buildConfig.language === 'cs' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="block font-medium text-sm sm:text-base">C#</span>
                      <span className="text-[10px] sm:text-xs text-gray-500">.NET</span>
                    </button>
                    <button onClick={() => manageConfigChange('language', 'cpp')} className={`p-2 sm:p-3 border rounded-lg text-center transition-all ${buildConfig.language === 'cpp' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                      <span className="block font-medium text-sm sm:text-base">C++</span>
                      <span className="text-[10px] sm:text-xs text-gray-500">MinGW</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>API URL</span>
                    </div>
                  </label>
                  <input type="text" value={buildConfig.apiUrl} onChange={(e) => manageConfigChange('apiUrl', e.target.value)} placeholder="http://localhost:8080/api" className="w-full p-2 border rounded-lg font-mono text-xs sm:text-sm" />
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Leave empty for default (localhost:8080)</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <h2 className="font-medium text-base sm:text-lg mb-3 sm:mb-4">Icon</h2>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden shrink-0" onClick={() => document.getElementById('icon-upload').click()}>
                  {iconPreview ? <img src={iconPreview} alt="Icon" className="w-full h-full object-contain" /> : <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Button variant="outline" className="w-full text-xs sm:text-sm" onClick={() => document.getElementById('icon-upload').click()}>
                    {buildConfig.icon ? buildConfig.icon.name : 'Select Icon File'}
                  </Button>
                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1">ICO format, 256x256px</p>
                </div>
                <input id="icon-upload" type="file" accept=".ico,.png" className="hidden" onChange={(e) => handleIconSelect(e.target.files[0])} />
              </div>
            </div>

            <Button className="w-full py-5 sm:py-6 text-sm sm:text-lg" onClick={startBuild}>
              Start Build Process
            </Button>
          </div>
        )}

        {buildStep === 'building' && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 sm:mb-6 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-500 animate-spin" />
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                <circle className="text-blue-500" strokeWidth="8" strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - buildStatus.progress / 100)}`} />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-medium mb-2">Building Application</h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-1">{buildConfig.language === 'cs' ? 'C# (.NET)' : 'C++ (MinGW)'}</p>
            <p className="text-xs sm:text-sm text-gray-500 mb-4 text-center">{buildStatus.message}</p>
            <div className="w-full bg-gray-200 rounded-full h-2 sm:h-2.5 mb-2">
              <div className="bg-blue-500 h-2 sm:h-2.5 rounded-full transition-all duration-500" style={{ width: `${buildStatus.progress}%` }} />
            </div>
            <p className="text-xs sm:text-sm text-gray-500">{buildStatus.progress}% Complete</p>
          </div>
        )}

        {buildStep === 'error' && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-medium">Build Failed</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 text-center">{buildStatus.message}</p>
            </div>
            {buildStatus.error && (
              <div className="border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 bg-red-50">
                <pre className="text-xs sm:text-sm text-red-700 whitespace-pre-wrap overflow-x-auto max-h-36 sm:max-h-48 overflow-y-auto">
                  {buildStatus.error}
                </pre>
              </div>
            )}
            <Button className="w-full" onClick={resetBuilder}>Try Again</Button>
          </div>
        )}

        {buildStep === 'complete' && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm">
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                <Check className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-medium">Build Completed!</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Build time: {buildStatus.buildTime} seconds</p>
            </div>
            <div className="border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
                  <span className="font-medium text-sm sm:text-base truncate">{buildStatus.fileName || `${buildConfig.appName}.exe`}</span>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 shrink-0 ml-2">{formatFileSize(buildStatus.fileSize)}</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                Version {buildConfig.version} — {buildConfig.language === 'cs' ? 'C# (.NET)' : 'C++ (MinGW)'}
              </p>
              <Button className="w-full flex items-center justify-center gap-2" onClick={downloadBuild}>
                <Download className="w-4 h-4" />
                <span className="text-sm sm:text-base">Download Executable</span>
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={resetBuilder}>Build Another</Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
