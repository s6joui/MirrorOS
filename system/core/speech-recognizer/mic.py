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

TALKING_MIN_AMP = 0.009;
MAX_TALK_SKIP_BLOCKS = 6;

TAP_TIME_SPACING = 2 #at least 2 seconds between talks
TAP_THRESHOLD = 0.15 #higher means less sensitive
FORMAT = pyaudio.paInt16 
SHORT_NORMALIZE = (1.0/32768.0)
INPUT_BLOCK_TIME = 0.1375
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
	INPUT_FRAMES_PER_BLOCK = 1024#int(input_device_rate*INPUT_BLOCK_TIME)
	                                                  
	stream = pa.open(format = FORMAT,                      
         channels = input_device_channels,                          
         rate = int(input_device_rate),                                  
         input = True,
         input_device_index = input_device_index,                           
         frames_per_buffer = INPUT_FRAMES_PER_BLOCK)   

	timeSinceLastTalk = 0
	timeSinceLastTap = 0
	notTalkingBlocks = -16;
	shouldRecord = False
	shouldSave = False
	saveFrames = []
	while True:
		try:
			block = stream.read(INPUT_FRAMES_PER_BLOCK)
		except IOError, e:
			sys.stderr.write("%s"%(e))
			#print( "Error recording: %s\n"%(e) )
		
		amplitude = get_rms(block)
		if shouldRecord == False and shouldSave == False:
			#print("AMP:%f THR:%f"%(amplitude,TAP_THRESHOLD))
			if amplitude > TAP_THRESHOLD:
				if time.time()-timeSinceLastTalk >= TAP_TIME_SPACING:
						print "TRIG"
						shouldRecord = True
						timeSinceLastTap = time.time();
		
		if shouldRecord and time.time()-timeSinceLastTap >= 0.35:
			#Record file			
			if notTalkingBlocks < MAX_TALK_SKIP_BLOCKS:
				if amplitude > TALKING_MIN_AMP:
					notTalkingBlocks = 0
				else:
					notTalkingBlocks = notTalkingBlocks + 1;
				saveFrames.append(block)
			else:
				shouldRecord = False
				shouldSave = True
				
		if shouldSave:
			#Save file
			shouldSave = False
			timeSinceLastTalk = time.time();

			waveFile = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
			waveFile.setnchannels(input_device_channels)
			waveFile.setsampwidth(pa.get_sample_size(FORMAT))
			waveFile.setframerate(input_device_rate)
			waveFile.writeframes(b''.join(saveFrames))
			waveFile.close()		
			
			subprocess.call("./wavToText.sh -k="+apiKey,shell=True)
			saveFrames = []
			notTalkingBlocks = -16;

			
else:
	#Start mic selector
	print "No microphone found. Please reconnect it and wait"

 
