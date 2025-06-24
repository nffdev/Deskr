'use client'

import React, { useState } from 'react';
import { useAuth } from "@/lib/hooks/useAuth";
import BottomNav from "@/components/nav/BottomNav";
import { Package, FileCode, Download, ArrowRight, Check, X, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Builder() {
  const { user } = useAuth();
  const [buildStep, setBuildStep] = useState('config'); 
  const [buildConfig, setBuildConfig] = useState({
    appName: '',
    version: '1.0.0',
    platform: 'win',
    icon: null,
    includeUpdater: true,
    outputDir: './dist'
  });
  const [buildStatus, setBuildStatus] = useState({
    progress: 0,
    message: '',
    error: null,
    buildTime: null
  });

  const manageConfigChange = (field, value) => {
    setBuildConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startBuild = () => {
    if (!buildConfig.appName) {
      alert('Application name is required');
      return;
    }

    setBuildStep('building');
    setBuildStatus({
      progress: 0,
      message: 'Initializing build process...',
      error: null,
      buildTime: null
    });

    const startTime = new Date();
    const buildSteps = [
      { progress: 10, message: 'Preparing build environment...' },
      { progress: 20, message: 'Compiling source code...' },
      { progress: 40, message: 'Bundling dependencies...' },
      { progress: 60, message: 'Creating executable...' },
      { progress: 80, message: 'Packaging application...' },
      { progress: 95, message: 'Finalizing build...' },
      { progress: 100, message: 'Build completed successfully!' }
    ];

    let stepIndex = 0;
    const buildInterval = setInterval(() => {
      if (stepIndex < buildSteps.length) {
        setBuildStatus(prev => ({
          ...prev,
          progress: buildSteps[stepIndex].progress,
          message: buildSteps[stepIndex].message
        }));
        stepIndex++;
      } else {
        clearInterval(buildInterval);
        const endTime = new Date();
        const buildTime = ((endTime - startTime) / 1000).toFixed(1);
        setBuildStatus(prev => ({
          ...prev,
          buildTime
        }));
        setBuildStep('complete');
      }
    }, 1500);
  };

  const resetBuilder = () => {
    setBuildStep('config');
    setBuildStatus({
      progress: 0,
      message: '',
      error: null,
      buildTime: null
    });
  };

  return (
    <div className="h-screen bg-gray-50 pb-16">
      <header className="p-4 bg-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h1 className="font-medium">Application Builder</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Build executable files</span>
              <span className="px-2 py-0.5 text-xs bg-blue-500 text-white rounded">Beta</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        {buildStep === 'config' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="font-medium text-lg mb-4">Build Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Application Name</label>
                  <input 
                    type="text" 
                    value={buildConfig.appName}
                    onChange={(e) => manageConfigChange('appName', e.target.value)}
                    placeholder="My Application"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Version</label>
                  <input 
                    type="text" 
                    value={buildConfig.version}
                    onChange={(e) => manageConfigChange('version', e.target.value)}
                    placeholder="1.0.0"
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Platform</label>
                  <select
                    value={buildConfig.platform}
                    onChange={(e) => manageConfigChange('platform', e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="win">Windows</option>
                    <option value="android">Android</option>
                    <option value="ios">IOS</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Application Icon</label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => document.getElementById('icon-upload').click()}
                    >
                      Select Icon File
                    </Button>
                    <input 
                      id="icon-upload"
                      type="file" 
                      accept=".ico,.png,.icns"
                      className="hidden"
                      onChange={(e) => manageConfigChange('icon', e.target.files[0])}
                    />
                    {buildConfig.icon && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Check className="w-4 h-4" />
                        <span>{buildConfig.icon.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="includeUpdater"
                    checked={buildConfig.includeUpdater}
                    onChange={(e) => manageConfigChange('includeUpdater', e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="includeUpdater" className="text-sm">Include auto-updater</label>
                </div>
              </div>
            </div>
            
            <Button 
              className="w-full py-6 text-lg"
              onClick={startBuild}
            >
              Start Build Process
            </Button>
          </div>
        )}
        
        {buildStep === 'building' && (
          <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 mb-6 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              </div>
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                />
                <circle
                  className="text-blue-500"
                  strokeWidth="8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="40"
                  cx="50"
                  cy="50"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - buildStatus.progress / 100)}`}
                />
              </svg>
            </div>
            
            <h2 className="text-xl font-medium mb-2">Building Application</h2>
            <p className="text-gray-500 mb-4">{buildStatus.message}</p>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${buildStatus.progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500">{buildStatus.progress}% Complete</p>
          </div>
        )}
        
        {buildStep === 'complete' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-medium">Build Completed!</h2>
              <p className="text-gray-500 mt-1">Build time: {buildStatus.buildTime} seconds</p>
            </div>
            
            <div className="border rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCode className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">{buildConfig.appName}.exe</span>
                </div>
                <span className="text-sm text-gray-500">{Math.floor(Math.random() * 50) + 10} MB</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">Version {buildConfig.version} for {buildConfig.platform === 'win' ? 'Windows' : buildConfig.platform === 'mac' ? 'macOS' : 'Linux'}</p>
              
              <Button className="w-full flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                <span>Download Executable</span>
              </Button>
            </div>
            
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={resetBuilder}
              >
                Build Another
              </Button>
              <Button className="flex-1">View Build Logs</Button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}