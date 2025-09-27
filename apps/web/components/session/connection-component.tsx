import { useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Check, Copy } from "lucide-react";
import axios from "axios";

// Frontend component
export function ConnectionStatus({ npxCommand }: { npxCommand: string }) {
    const [status, setStatus] = useState('waiting');
    const [projectName, setProjectName] = useState('');
    const [token] = useState(crypto.randomUUID());
    const intervalRef = useRef(null); // Store interval reference
    

    useEffect(() => {
      // Register token when component mounts
      registerToken();
      
      // Cleanup on unmount
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }, []);
    
    const registerToken = async () => {
      // Tell backend about this token
      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/register-token`, { token });
      if (res.status === 200) {
        setStatus('waiting');
      } else {
        setStatus('error');
      }
      // Start polling
      startPolling();
    };
    
    const startPolling = () => {
      let pollCount = 0;
      
      intervalRef.current = setInterval(async () => {
        pollCount++;
        
        // Stop after 60 polls (1 minute)
        if (pollCount > 60) {
          clearInterval(intervalRef.current);
          setStatus('timeout');
          return;
        }
        
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/check-token?token=${token}`);
          const data = res.data;
          
          if (data.data.status === 'connected') {
            // SUCCESS! Stop polling
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            
            setStatus('connected');
            setProjectName(data.projectName);
            
            // Now you can enable voice chat!
            console.log('Connected to project:', data.projectName);
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      }, 1000); // Check every second
    };
    
    return (
      <div>
       <div className="space-y-6">
                    {/* <div>
                      <Label className="text-white text-sm font-medium mb-3 block">
                        Project Name *
                      </Label>
                      <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="What's your project about?"
                        className="bg-white/5 border-white/10 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg"
                      />
                    </div> */}

                    <div>
                      <Label className="text-white text-sm font-medium mb-3 block">
                        NPX Command
                      </Label>
                      <div className="relative">
                        <div className="bg-black/20 border border-white/10 rounded-lg p-4 pr-12">
                          <code className="text-sm text-gray-300 font-mono break-all">
                            {npxCommand}{token}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigator.clipboard.writeText(`${npxCommand} --token=${token}`)}
                          className="absolute overflow-hidden right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Run this command in your project directory to start monitoring
                      </p>
                    </div>
                  </div>
        
        {status === 'waiting' && <p>⏳ Waiting for CLI to connect...</p>}
        {status === 'connected' && <p>✅ Connected to: {projectName}</p>}
        {status === 'timeout' && <p>❌ Connection timeout. Try again.</p>}
      </div>
    );
  }