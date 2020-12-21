# Hoverboard-Web-Serial-Control

Experiment to control hoverboard, log and plot output data through a simple webpage.<br>
The tool doesn't need installation and is accessible via this link.<br>
https://candas1.github.io/Hoverboard-Web-Serial-Control/

It works with USART serial protocol and USART DEBUG in following firmware:<br>
https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC



From a computer, you can use both WEB Serial API and WEB Bluetooth API.
From mobile, only WEB Bluetooth API is supported (not supported on IOS).

## APIs
### WEB Serial API:
The tool is using Web Serial API to connect to the hoverboard through a COM port of your PC(FTDI,Bluetooth 2.0,...).<br>
https://web.dev/serial/<br>
Select the required baud rate, click on connect button, and select the COM port corresponding to your FTDI.

### WEB Bluetooth API:
The tool is using Web Bluetooth API to connect to Bluetooth BLE devices (e.g. AT-09, HM-10...).<br>
https://web.dev/bluetooth/<br>
Make sure you [configured](https://github.com/Candas1/Hoverboard-Web-Serial-Control/wiki/Configure-BLE-device) your BLE device with the right baud rate.
Click on connect button and select the right BLE device.


## Modes
### Ascii:
If hoverboard is communicating through ASCII Serial debug, messages are being parsed if first word contains semicolon character.<br>
Parsed data is displayed in the log and in the graph.<br>

### Usart:
The tool sends binary commands to control the hoverboard (Speed/steer) via the virtual controller.<br>
Feedback is received through Binary Serial Protocol,messages are being parsed and checksum is validated to discard transmission errors.<br>
Parsed data is displayed in the log and in the graph.<br>

### Ibus:
The tool sends Flysky Ibus commands to control the hoverboard (Speed/steer) via the virtual controller.<br>
Feedback is received through Binary Serial Protocol (not ibus telemetry),messages are being parsed and checksum is validated to discard transmission errors.<br>
Parsed data is displayed in the log and in the graph.<br>
To-do : This mode is not working with BLE yet because of limitation of message size (20 bytes).
