import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BOARD)

TRIG = 7
ECHO = 12
TRIG2 = 35
ECHO2 = 38

MAX_DISTANCE = 55
TARGET_HOLD_COUNT = 8

GPIO.setup(TRIG,GPIO.OUT)
GPIO.output(TRIG,0)

GPIO.setup(ECHO,GPIO.IN)

GPIO.setup(TRIG2,GPIO.OUT)
GPIO.output(TRIG2,0)

GPIO.setup(ECHO2,GPIO.IN)

time.sleep(0.1)

prevSensorL = False
prevSensorR = False
holdCountL = 0
holdCountR = 0
lastInteractionTime = 0

print ("Starting gesture recognition")

try:  
    # here you put your main loop or block of code  
    while True:
		value_list_right = []	
		for x in xrange(0,5):
			GPIO.output(TRIG,1)
			time.sleep(0.0001)
			GPIO.output(TRIG,0)
						
			start = time.time()
			while GPIO.input(ECHO) == 0 and time.time()-start < 0.4:
				pass
			start = time.time()

			while GPIO.input(ECHO) == 1:
				pass
			stop = time.time()
			
			d = (stop - start) * 17000
			value_list_right.append(d)

		value_list_right.sort()
		distance = value_list_right[2]

		value_list_left = []	
		for x in xrange(0,5):
			GPIO.output(TRIG2,1)
			time.sleep(0.0001)
			GPIO.output(TRIG2,0)
						
			start = time.time()
			while GPIO.input(ECHO2) == 0 and time.time()-start < 0.4:
				pass
			start = time.time()

			while GPIO.input(ECHO2) == 1:
				pass
			stop = time.time()
			
			d = (stop - start) * 17000
			value_list_left.append(d)

		value_list_left.sort()
		distance2 = value_list_left[2]

		interaction = False

		sensorR = distance < MAX_DISTANCE
		sensorL = distance2 < MAX_DISTANCE

		if prevSensorL and sensorR:
			print "111"
		if prevSensorR and sensorL:
			print "100"

		if prevSensorL and sensorL:
			holdCountL = holdCountL + 1
			if holdCountL < TARGET_HOLD_COUNT and holdCountL > 0:
				print "0"
            
		if prevSensorR and sensorR:
			holdCountR = holdCountR + 1
			if holdCountR < TARGET_HOLD_COUNT and holdCountR > 0:
				print "1"
        
		if holdCountL >= TARGET_HOLD_COUNT:
			holdCountL = -5
			print "10"

		if holdCountR >= TARGET_HOLD_COUNT:
			holdCountR = -5
			print "11"

		interaction = sensorL or sensorR

		prevSensorL = sensorL
		prevSensorR = sensorR
        
		if interaction:
			lastInteractionTime = time.time()
		elif time.time() - lastInteractionTime > 1:
			print "54"
			prevSensorL = False
			prevSensorR = False
			holdCountL = 0
			holdCountR = 0
			lastInteractionTime = time.time()
            
		time.sleep(0.05)
except KeyboardInterrupt:  
    # here you put any code you want to run before the program   
    # exits when you press CTRL+C  
    print ("exiting")
except:  
    # this catches ALL other exceptions including errors.  
    # You won't get any error messages for debugging  
    # so only use it once your code is working  
    print ("Other error or exception occurred!")
finally:  
    GPIO.cleanup() # this ensures a clean exit 
