"use client"
import React, { useState, useEffect, useRef, useContext } from 'react';
import { FileContext } from '../contexts/fileContext';
import { redirect } from 'next/navigation';

const UploadAudio = () => {
    const inputFile = useRef<HTMLInputElement>(null);
    const fileContext = useContext(FileContext);

    if (!fileContext) {
        throw new Error("FileContext must be used within a FileContextProvider");
    }

    const { fileURL, setFileURL } = fileContext;
    const [file, setFile] = useState<string | null>(null);

    useEffect(() => {
        if (file) {
            setFileURL(file);
            console.log('file selected : ', file)
            redirect('/edit')
        }
    }, [file, setFileURL]);

    const handleButtonClick = () => {
        inputFile.current?.click();
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(URL.createObjectURL(e.target.files[0]));
        }
    };

    return (
        <div className='upload-audio'>
            <span style={{ color: '#000000' }} className='text-6xl'>
                Audio Cutter
            </span>
            <h1>Free editor to trim and cut any audio file online</h1>

            <button onClick={handleButtonClick} className="relative inline-flex h-12 w-40 overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50">
                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white backdrop-blur-3xl">
                    Browse my files
                </span>
            </button>

            <input
                type='file'
                id='file'
                ref={inputFile}
                style={{ display: 'none' }}
                accept='audio/*'
                onChange={handleFileUpload}
            />
        </div>
    );
};

export default UploadAudio;
