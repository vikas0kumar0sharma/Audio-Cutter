import UploadAudio from '@/components/UploadAudio'
import React from 'react'

const page = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <UploadAudio />
      </div>
    </main>
  )
}

export default page