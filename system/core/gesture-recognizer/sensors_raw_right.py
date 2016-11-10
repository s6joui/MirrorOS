import RPi.GPIO as GPIO
import time

GPIO.setmode(GPIO.BOARD)

TRIG = 7
ECHO = 12

GPIO.setup(TRIG,GPIO.OUT)
GPIO.output(TRIG,0)

GPIO.setup(ECHO,GPIO.IN)

time.sleep(0.1)

print ("Starting gesture recognition")

try:  
    # here you put your main loop or block of code  
	while True:
		value_list = []
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
			
			distance = (stop - start) * 17000
			value_list.append(distance)
			time.sleep(0.025)

		value_list.sort();
		print value_list[2]
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

