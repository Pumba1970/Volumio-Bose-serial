#!/usr/bin/env python3

import serial
import sys
import os
import time
import json

# Fix the import path to find the CmdSet module
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

# Load commands from JSON file
commands = {}
try:
    with open(os.path.join(script_dir, 'commands.json'), 'r') as f:
        commands = json.load(f)
    print("Loaded commands from commands.json")
except Exception as e:
    print(f"Warning: Could not load commands.json: {e}")
    # We'll fall back to hardcoded commands if needed

# Get command line arguments
if len(sys.argv) < 3:
    print("Usage: python3 BSC.py <command> <serial_port>", file=sys.stderr)
    sys.exit(1)

command = sys.argv[1]
hardware_port = sys.argv[2]

print(f"Command: {command}, Port: {hardware_port}")

# Map command to actual RS-232 command string
command_line = None

# Check if command exists in the commands.json file
if commands and 'default' in commands:
    if command in commands['default']:
        command_line = commands['default'][command]
        print(f"Found command in default section: {command_line}")
    elif 'bose' in commands and command in commands['bose']:
        command_line = commands['bose'][command]
        print(f"Found command in bose section: {command_line}")

# If command not found in JSON, use hardcoded fallbacks
if command_line is None:
    # Power commands
    if command == "power":
        command_line = "KP 1,,,,,0 0x0D"
    elif command == "power Room 1":
        command_line = "KP 1,,,,,0 0x0D"
    elif command == "power Room 2":
        command_line = "KP 1,,,,,1 0x0D"
    elif command == "poweralloff":
        command_line = "PAO 0x0D"
    # Volume commands
    elif command == "volumeplus":
        command_line = "KP 26,,,,,0 0x0D"
    elif command == "volumeplus Room 1":
        command_line = "KP 26,,,,,0 0x0D"
    elif command == "volumeplus Room 2":
        command_line = "KP 26,,,,,1 0x0D"
    elif command == "volumeminus":
        command_line = "KP 27,,,,,0 0x0D"
    elif command == "volumeminus Room 1":
        command_line = "KP 27,,,,,0 0x0D"
    elif command == "volumeminus Room 2":
        command_line = "KP 27,,,,,1 0x0D"
    elif command == "mute":
        command_line = "KP 53,,,,,0 0x0D"
    elif command == "mute Room 1":
        command_line = "KP 53,,,,,0 0x0D"
    elif command == "mute Room 2":
        command_line = "KP 53,,,,,1 0x0D"
    # Source commands
    elif command == "sourcetv":
        command_line = "KP 7,,,,,0 0x0D"
    elif command == "sourcecd":
        command_line = "KP 4,,,,,0 0x0D"
    elif command == "sourcefm":
        command_line = "KP 63,,,,,0 0x0D"
    elif command == "sourceam":
        command_line = "KP 54,,,,,0 0x0D"
    elif command == "sourcephono":
        command_line = "0<="
    elif command == "sourcetape":
        command_line = "0<:"
    elif command == "copysourcetotape1":
        command_line = "09?"
    elif command == "copysourcetotape2":
        command_line = "09@"
    elif command == "cabsat Room 1":
        command_line = "KP 54,,,,,0 0x0D"
    elif command == "cabsat Room 2":
        command_line = "KP 54,,,,,1 0x0D"
    # Numpad
    elif command == "NUMZero":
        command_line = "09:"
    elif command == "NUMOne" or command == "NUMone":
        command_line = "096"
    elif command == "NUMTwo" or command == "NUMtwo":
        command_line = "095"
    elif command == "NUMThree":
        command_line = "094"
    elif command == "NUMFour":
        command_line = "093"
    elif command == "NUMFive":
        command_line = "092"
    elif command == "NUMSix":
        command_line = "09>"
    elif command == "NUMSeven":
        command_line = "09="
    elif command == "NUMEight":
        command_line = "09<"
    elif command == "NUMNine":
        command_line = "09;"
    # Audio settings
    elif command == "balancecenter":
        command_line = "0;9"
    elif command == "balanceplus":
        command_line = "0;:"
    elif command == "balanceminus":
        command_line = "0;;"
    elif command == "basscenter":
        command_line = "0;1"
    elif command == "bassplus":
        command_line = "0;7"
    elif command == "bassminus":
        command_line = "0;8"
    elif command == "treblecenter":
        command_line = "0;<"
    elif command == "trebleplus":
        command_line = "0;?"
    elif command == "trebleminus":
        command_line = "0;@"
    elif command == "lowbass":
        command_line = "0:8"
    elif command == "loudness":
        command_line = "0;>"
    elif command == "hblend":
        command_line = "0:9"
    elif command == "20hz":
        command_line = "0<1"
    elif command == "EQ":
        command_line = "0<6"
    # Speaker/Output
    elif command == "SPEAKER":
        command_line = "0;2"
    elif command == "PreOut1":
        command_line = "0<?"
    elif command == "PreOut2":
        command_line = "0<@"
    # Playback Control
    elif command == "start":
        command_line = "0:6"
    elif command == "pause":
        command_line = "0:5"
    elif command == "stop":
        command_line = "0:4"
    elif command == "record":
        command_line = "0:>"
    elif command == "programplus":
        command_line = "097"
    elif command == "programminus":
        command_line = "098"
    elif command == "autoplus":
        command_line = "0:3"
    elif command == "autominus":
        command_line = "0:2"
    elif command == "manualplus":
        command_line = "0:?"
    elif command == "manualminus":
        command_line = "0:@"
    # CD Remote
    elif command == "CDPlay":
        command_line = "026"
    elif command == "CDPause":
        command_line = "025"
    elif command == "CDSkipP":
        command_line = "02;"
    elif command == "CDSkipN":
        command_line = "02:"
    elif command == "CDFFp":
        command_line = "023"
    elif command == "CDFFn":
        command_line = "022"
    elif command == "CDRepeat":
        command_line = "03="
    elif command == "CDAB":
        command_line = "03>"
    elif command == "CDClear":
        command_line = "02>"
    elif command == "CDTime":
        command_line = "03<"
    elif command == "CDIndex":
        command_line = "02<"
    elif command == "CDReturn":
        command_line = "024"
    elif command == "CDSet":
        command_line = "02="
    elif command == "CDzero":
        command_line = "01:"
    elif command == "CDone":
        command_line = "016"
    elif command == "CDtwo":
        command_line = "015"
    elif command == "CDthree":
        command_line = "014"
    elif command == "CDfour":
        command_line = "013"
    elif command == "CDfive":
        command_line = "012"
    elif command == "CDsix":
        command_line = "01>"
    elif command == "CDseven":
        command_line = "01="
    elif command == "CDeight":
        command_line = "01<"
    elif command == "CDnine":
        command_line = "01;"
    else:
        print(f"Warning: Command '{command}' not found")
        command_line = command  # Use the command as-is as fallback

print(f"Using command: {command_line}")

# Try to send the command to the serial port
try:
    # Open serial port with correct settings for your device
    ser = serial.Serial(
        port=hardware_port,
        baudrate=19200,
        bytesize=serial.EIGHTBITS,
        parity=serial.PARITY_NONE,
        stopbits=serial.STOPBITS_ONE,
        timeout=1
    )
    
    # For commands with "KP" prefix and "0x0D" suffix, we need to handle them specially
    if command_line and "KP" in command_line and "0x0D" in command_line:
        # Split the command to handle the hex part
        parts = command_line.split()
        # Reconstruct the command without the 0x0D part
        cmd_without_suffix = " ".join(parts[:-1])
        # Add the actual carriage return character
        final_cmd = cmd_without_suffix + "\r"
        print(f"Sending formatted command: {final_cmd}")
        ser.write(final_cmd.encode())
    else:
        # For other commands, send them as-is
        print(f"Sending raw command: {command_line}")
        ser.write(command_line.encode())
    
    # Wait for response (optional)
    time.sleep(0.1)
    
    # Read response (optional)
    if ser.in_waiting:
        response = ser.read(ser.in_waiting)
        print(f"Response: {response}")
    
    # Close serial port
    ser.close()
    print(f"Command sent successfully: {command}")
    
except Exception as e:
    print(f"Error sending command: {e}", file=sys.stderr)
    sys.exit(1)

sys.exit(0)