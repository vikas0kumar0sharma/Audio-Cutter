import React from 'react';
import AudioWaveform from '@/components/AudioWaveFrom'

const EditPage = () => {
	return (
		<div>
			<h1 style={{ textAlign: 'center', margin: '1em 0' }}>
				Edit Your Audio File
			</h1>
			<AudioWaveform />
		</div>
	);
};

export default EditPage;