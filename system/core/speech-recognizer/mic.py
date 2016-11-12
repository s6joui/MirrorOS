import pyaudio
import struct
import math
import time
import wave
import subprocess
import os
import sys

apiKey = sys.argv[1]
abspath = os.path.abspath(__file__)
dname = os.path.dirname(abspath)
os.chdir(dname)

TALKING_MIN_AMP = 0.01;
MAX_TALK_SKIP_BLOCKS = 4;

TAP_TIME_SPACING = 2 #at least 2 seonds between talks
TAP_THRESHOLD = 0.15 #higher means less sensitive
FORMAT = pyaudio.paInt16 
SHORT_NORMALIZE = (1.0/32768.0)
INPUT_BLOCK_TIME = 0.05
RECORD_SECONDS = 4
WAVE_OUTPUT_FILENAME = "file.wav"

def get_rms(block):

    # RMS amplitude is defined as the square root of the 
    # mean over time of the square of the amplitude.
    # so we need to convert this string of bytes into 
    # a string of 16-bit samples...

    # we will get one short out for each 
    # two chars in the string.
    count = len(block)/2
    format = "%dh"%(count)
    shorts = struct.unpack( format, block )

    # iterate over the block.
    sum_squares = 0.0
    for sample in shorts:
    # sample is a signed short in +/- 32768. 
    # normalize it to 1.0
        n = sample * SHORT_NORMALIZE
        sum_squares += n*n

    return math.sqrt( sum_squares / count )

pa = pyaudio.PyAudio()   

#Look for microphone
input_device_index = -1
input_device_channels = 0
input_device_rate = 0
for i in range(pa.get_device_count()):
	dev = pa.get_device_info_by_index(i)
	if dev['maxInputChannels'] > 0:
		input_device_index = i
		input_device_channels = dev['maxInputChannels']
		input_device_rate = dev['defaultSampleRate']
	
if input_device_index >= 0:
	#Start listening
	INPUT_FRAMES_PER_BLOCK = int(input_device_rate*INPUT_BLOCK_TIME)
	                                                  
	stream = pa.open(format = FORMAT,                      
         channels = input_device_channels,                          
         rate = int(input_device_rate),                                  
         input = True,
         input_device_index = input_device_index,                           
         frames_per_buffer = INPUT_FRAMES_PER_BLOCK)   

	timeSinceLastTalk = 0
	timeSinceLastTap = 0
	shouldRecord = False
	while True:
		try:
			block = stream.read(INPUT_FRAMES_PER_BLOCK)
		except IOError, e:
			sys.stderr.write("%s"%(e))
			#print( "Error recording: %s\n"%(e) )
		
		if shouldRecord == False:
			amplitude = get_rms(block)
			#print("AMP:%f THR:%f"%(amplitude,TAP_THRESHOLD))
			if amplitude > TAP_THRESHOLD:
				if time.time()-timeSinceLastTalk >= TAP_TIME_SPACING:
						print "TRIG"
						shouldRecord = True
						timeSinceLastTap = time.time();
		
		if shouldRecord and time.time()-timeSinceLastTap >= 0.35:
			#Save file
			shouldRecord = False
			frames = []
			
			notTalkingBlocks = -16;
			while notTalkingBlocks < MAX_TALK_SKIP_BLOCKS:
				data = stream.read(INPUT_FRAMES_PER_BLOCK)
				amp = get_rms(data)
				if amp > TALKING_MIN_AMP:
					notTalkingBlocks = 0
				else:
					notTalkingBlocks = notTalkingBlocks + 1;
					
				frames.append(data)
				
			timeSinceLastTalk = time.time();

			waveFile = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
			waveFile.setnchannels(input_device_channels)
			waveFile.setsampwidth(pa.get_sample_size(FORMAT))
			waveFile.setframerate(input_device_rate)
			waveFile.writeframes(b''.join(frames))
			waveFile.close()		
			
			subprocess.call("./wavToText.sh -k="+apiKey,shell=True)
			
else:
	#Start mic selector
	print "No microphone found. Please reconnect it and wait"

 
