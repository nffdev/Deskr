import React from 'react';
import { Settings, Monitor, Radio } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useNavigate } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();

  return (    

    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around p-4">
        <button className="flex flex-col items-center text-blue-500">
          <Monitor className="w-6 h-6" />
          <span className="text-xs mt-1">Device List</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <Radio className="w-6 h-6" />
          <span className="text-xs mt-1">Remote Control</span>
        </button>
        <button className="flex flex-col items-center text-gray-400">
          <Settings className="w-6 h-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    )
}