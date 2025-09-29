"use client"

import { useState } from "react";
import { Button } from "../ui/button";
import { Copy, CheckCircle } from "lucide-react";

export default function CopyButton({ token }: { token: string }) {
   const [copied, setCopied] = useState(false);

   const copyToken = () => {
      navigator.clipboard.writeText(`npx copair --token=${token}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
   };
   return (
      <Button
         variant='ghost'
         size='sm'
         onClick={copyToken}
         className='ml-2 cursor-pointer'
      >
         {copied ? (
            <CheckCircle className='w-4 h-4 text-green-500' />
         ) : (
            <Copy className='w-4 h-4' />
         )}
      </Button>
   );
}
