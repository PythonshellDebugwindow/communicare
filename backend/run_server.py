import os, time


while True:
    print("Press Ctrl+C once to restart, twice to quit")
    try:
        os.system("python server.py")
    except KeyboardInterrupt:
        pass
    print("Restarting...")
    time.sleep(1)
