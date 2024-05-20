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
            <i style={{ color: '#531A65' }} className='material-icons audio-icon'>
                library_music
            </i>
            <h1>Upload your audio file here</h1>
            <button className='upload-btn' onClick={handleButtonClick}>
                Upload
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
