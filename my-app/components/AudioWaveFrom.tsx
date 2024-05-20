"use client"

import React, { useState, useEffect, useContext, useRef } from 'react';
// @ts-ignore
import TimelinePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.timeline.min.js';
// @ts-ignore
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';
// @ts-ignore
import wavesurfer from 'wavesurfer.js';
// @ts-ignore
import { WaveSurfer } from 'wavesurfer.js';
import { FileContext } from '../contexts/fileContext';
import { redirect } from 'next/navigation';
import { MdDelete, MdOutlineReplay } from 'react-icons/md';
import { RiScissors2Line } from 'react-icons/ri';
import { FaPause, FaPlay, FaVolumeUp } from 'react-icons/fa';
import { FaVolumeXmark } from 'react-icons/fa6';
import { IoArrowBackSharp } from 'react-icons/io5';
import { useRouter } from 'next/navigation';

const AudioWaveform = () => {
	const wavesurferRef = useRef(null);
	const timelineRef = useRef(null);

	const fileContext = useContext(FileContext);

	if (!fileContext) {
		throw new Error("FileContext must be used within a FileContextProvider");
	}

	// fetch file url from the context
	const { fileURL, setFileURL } = fileContext

	const router = useRouter();

	if (!fileURL) {
		router.push('/')	
	}

	// crate an instance of the wavesurfer
	const [wavesurferObj, setWavesurferObj] = useState<WaveSurfer | null>(null);

	const [playing, setPlaying] = useState(true); // to keep track whether audio is currently playing or not
	const [volume, setVolume] = useState(1); // to control volume level of the audio. 0-mute, 1-max
	const [zoom, setZoom] = useState(1); // to control the zoom level of the waveform
	const [duration, setDuration] = useState(0); // duration is used to set the default region of selection for trimming the audio

	// create the waveform inside the correct component
	useEffect(() => {
		if (wavesurferRef.current && !wavesurferObj) {
			setWavesurferObj(
				wavesurfer.create({
					container: '#waveform',
					scrollParent: true,
					autoCenter: true,
					cursorColor: 'blue',
					loopSelection: true,
					waveColor: '#23F58C',
					progressColor: '#9FAF9F',
					responsive: true,
					plugins: [
						TimelinePlugin.create({
							container: '#wave-timeline',
						}),
						RegionsPlugin.create({})
					],
				})
			);
		}
	}, [wavesurferRef, wavesurferObj]);

	// once the file URL is ready, load the file to produce the waveform
	useEffect(() => {
		if (fileURL && wavesurferObj) {
			wavesurferObj.load(fileURL);
		}
	}, [fileURL, wavesurferObj]);

	useEffect(() => {
		if (wavesurferObj) {
			// once the waveform is ready, play the audio
			wavesurferObj.on('ready', () => {
				wavesurferObj.play();
				wavesurferObj.enableDragSelection({}); // to select the region to be trimmed
				setDuration(Math.floor(wavesurferObj.getDuration())); // set the duration in local state
			});

			// once audio starts playing, set the state variable to true
			wavesurferObj.on('play', () => {
				setPlaying(true);
			});

			// once audio starts playing, set the state variable to false
			wavesurferObj.on('finish', () => {
				setPlaying(false);
			});

			// if multiple regions are created, then remove all the previous regions so that only 1 is present at any given time
			wavesurferObj.on('region-updated', (region) => {
				const regions = region.wavesurfer.regions.list;
				const keys = Object.keys(regions);
				if (keys.length > 1) {
					regions[keys[0]].remove();
				}
			});
		}
	}, [wavesurferObj]);

	// set volume of the wavesurfer object, whenever volume variable in state is changed
	useEffect(() => {
		if (wavesurferObj) wavesurferObj.setVolume(volume);
	}, [volume, wavesurferObj]);

	// set zoom level of the wavesurfer object, whenever the zoom variable in state is changed
	useEffect(() => {
		if (wavesurferObj) wavesurferObj.zoom(zoom);
	}, [zoom, wavesurferObj]);

	// when the duration of the audio is available, set the length of the region depending on it, so as to not exceed the total length of the audio
	useEffect(() => {
		if (duration && wavesurferObj) {

			const region =
				wavesurferObj.regions.list[
				Object.keys(wavesurferObj.regions.list)[0]
				];

			if (!region) {
				// add a region with default length
				wavesurferObj.addRegion({
					start: Math.floor(duration / 2) - Math.floor(duration) / 5, // time in seconds
					end: Math.floor(duration / 2), // time in seconds
					color: 'hsla(265, 100%, 86%, 0.4)', // color of the selected region, light hue of purple
				});
			}
		}
	}, [duration, wavesurferObj]);

	const handlePlayPause = (e) => {
		wavesurferObj.playPause();
		setPlaying(!playing);
	};

	const handleReload = (e) => {
		// stop will return the audio to 0s, then play it again
		wavesurferObj.stop();
		wavesurferObj.play();
		setPlaying(true); // to toggle the play/pause button icon
	};

	const handleVolumeSlider = (e) => {
		setVolume(e.target.value);
	};

	const handleRemove = (e) => {
		if (wavesurferObj) {
			// get start and end points of the selected region
			const region =
				wavesurferObj.regions.list[
				Object.keys(wavesurferObj.regions.list)[0]
				];

			if (region) {
				const start = region.start;
				const end = region.end;

				// obtain the original array of the audio
				const original_buffer = wavesurferObj.backend.buffer;

				// create a temporary new buffer array with the same length, sample rate and no of channels as the original audio
				const new_buffer = wavesurferObj.backend.ac.createBuffer(
					original_buffer.numberOfChannels,
					original_buffer.length,
					original_buffer.sampleRate
				);

				// create 2 indices:
				// left & right to the part to be trimmed
				const first_list_index = start * original_buffer.sampleRate;
				const second_list_index = end * original_buffer.sampleRate;
				const second_list_mem_alloc =
					original_buffer.length - end * original_buffer.sampleRate;

				// create a new array upto the region to be trimmed
				const new_list = new Float32Array(first_list_index);

				// create a new array of region after the trimmed region
				const second_list = new Float32Array(second_list_mem_alloc);

				// create an array to combine the 2 parts
				const combined = new Float32Array(original_buffer.length);

				// 2 channels: 1-right, 0-left
				// copy the buffer values for the 2 regions from the original buffer

				// for the region to the left of the trimmed section
				original_buffer.copyFromChannel(new_list, 1);
				original_buffer.copyFromChannel(new_list, 0);

				// for the region to the right of the trimmed section
				original_buffer.copyFromChannel(
					second_list,
					1,
					second_list_index
				);
				original_buffer.copyFromChannel(
					second_list,
					0,
					second_list_index
				);

				// create the combined buffer for the trimmed audio
				combined.set(new_list);
				combined.set(second_list, first_list_index);

				// copy the combined array to the new_buffer
				new_buffer.copyToChannel(combined, 1);
				new_buffer.copyToChannel(combined, 0);

				// load the new_buffer, to restart the wavesurfer's waveform display
				wavesurferObj.loadDecodedBuffer(new_buffer);

				wavesurferObj.addRegion({
					start: 0, // time in seconds
					end: Math.floor(duration), // time in seconds
					color: 'hsla(265, 100%, 86%, 0.4)', // color of the selected region, light hue of purple
				});

				const regions = region.wavesurfer.regions.list;
				const keys = Object.keys(regions);
				if (keys.length > 1) {
					regions[keys[0]].remove();
				}
			}
		}
	};

	const handleCut = (e) => {
		if (wavesurferObj) {
			// get start and end points of the selected region
			const region =
				wavesurferObj.regions.list[
				Object.keys(wavesurferObj.regions.list)[0]
				];

			if (region) {
				const start = region.start;
				const end = region.end;

				// obtain the original array of the audio
				const original_buffer = wavesurferObj.backend.buffer;

				// calculate the length of the new buffer to hold only the selected region
				const new_length = (end - start) * original_buffer.sampleRate;

				// create a new buffer to hold the selected region
				const new_buffer = wavesurferObj.backend.ac.createBuffer(
					original_buffer.numberOfChannels,
					new_length,
					original_buffer.sampleRate
				);

				// create a Float32Array to hold the data for the selected region
				const selected_region_data = new Float32Array(new_length);

				// copy data from the original buffer for the selected region
				original_buffer.copyFromChannel(selected_region_data, 0, start * original_buffer.sampleRate);
				new_buffer.copyToChannel(selected_region_data, 0, 0);

				if (original_buffer.numberOfChannels > 1) {
					original_buffer.copyFromChannel(selected_region_data, 1, start * original_buffer.sampleRate);
					new_buffer.copyToChannel(selected_region_data, 1, 0);
				}

				// load the new buffer, to restart the wavesurfer's waveform display
				wavesurferObj.loadDecodedBuffer(new_buffer);

				wavesurferObj.addRegion({
					start: 0, // time in seconds
					end: Math.floor(duration), // time in seconds
					color: 'hsla(265, 100%, 86%, 0.4)', // color of the selected region, light hue of purple
				});
			}
		}
	};

	const handleDownload = () => {
		if (wavesurferObj) {
			wavesurferObj.exportPCM().then(pcmData => {
				const audioBlob = new Blob([pcmData], { type: 'audio/wav' });
				const audioUrl = URL.createObjectURL(audioBlob);
				const link = document.createElement('a');
				link.href = audioUrl;
				link.download = 'updated_audio.wav';
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			});
		}
	};

	const handleBack = () => {
		router.push('/');
	};

	return (
		<section className='waveform-container'>
			<div className='flex flex-col gap-12'>

				<div className='flex flex-row-reverse'>
					<button onClick={handleBack} className="px-4 py-2 rounded-md border border-neutral-300 bg-neutral-100  text-sm hover:-translate-y-1 transform transition duration-200 hover:shadow-md">
						<div className='flex flex-row items-center space-x-2'>
							<IoArrowBackSharp /> <span>Back</span>
						</div>
					</button>
				</div>

				<div>
					<div ref={wavesurferRef} id='waveform' />
					<div ref={timelineRef} id='wave-timeline' />
				</div>

				<div className='flex flex-row-reverse gap-11'>

					<button onClick={handleRemove} className="px-4 py-2 rounded-md border border-neutral-300 bg-neutral-100  text-sm hover:-translate-y-1 transform transition duration-200 hover:shadow-md">
						<div className='flex flex-row items-center space-x-2'>
							<MdDelete />
							<span>Remove</span>
						</div>

					</button>

					<button onClick={handleCut} className="px-4 py-2 rounded-md border border-neutral-300 bg-neutral-100  text-sm hover:-translate-y-1 transform transition duration-200 hover:shadow-md">
						<div className='flex flex-row items-center space-x-2'>
							<RiScissors2Line /> <span>Cut</span>
						</div>
					</button>

				</div>

				<div className='flex flex-row space-x-20 border-t border-neutral-400 pt-4'>

					<button onClick={handlePlayPause} className="shadow-[inset_0_0_0_2px_#616467] text-black px-14 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200">
						{playing ? (
							<FaPause className='h-5 w-5' />
						) : (
							<FaPlay className='h-5 w-5' />
						)}
					</button>

					<button onClick={handleReload} className="text-black px-12 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent dark:text-neutral-200 transition duration-200">
						<MdOutlineReplay className='h-8 w-8' />
					</button>

					<div className='flex flex-row space-x-2 items-center '>
						{volume > 0 ? (
							<FaVolumeUp className='h-8 w-8' />
						) : (
							<FaVolumeXmark className='h-8 w-8' />
						)}
						<input
							type='range'
							min='0'
							max='1'
							step='0.05'
							value={volume}
							onChange={handleVolumeSlider}
							className='slider volume-slider'
						/>
					</div>

					<button onClick={handleDownload} className="shadow-[inset_0_0_0_2px_#616467] text-black px-14 py-4 rounded-full tracking-widest uppercase font-bold bg-transparent hover:bg-[#616467] hover:text-white dark:text-neutral-200 transition duration-200">
						Save
					</button>

				</div>

			</div>

		</section>
	);
};

export default AudioWaveform;