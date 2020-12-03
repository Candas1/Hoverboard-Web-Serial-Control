# Hoverboard-Web-Serial-Control

Experiment to control hoverboard, log and plot output data through a simple webpage.
Works with USART serial protocol and USART DEBUG in following firmware:<br>
https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC

The tool needs no installation and is accessible via this link.<br>
https://candas1.github.io/Hoverboard-Web-Serial-Control/

## Serial:
From a computer, the tool is using Web Serial API and lets you interface with the hoverboard through an FTDI.<br>
https://web.dev/serial/<br>
Select the required baud rate, click on connect button, and select the COM port corresponding to your FTDI.

## Bluetooth:
From mobile, the tool is using Web Bluetooth API andlets you use a Bluetooth BLE device (e.g. AT-09, HM-10...).<br>
https://web.dev/bluetooth/<br>
Make sure you [configured](https://github.com/Candas1/Hoverboard-Web-Serial-Control/wiki/Configure-BLE-device) your BLE device with the right baud rate.
Click on connect button and select the right BLE device.

## Ascii:
If hoverboard is communicating through ASCII Serial debug, messages are being parsed and number of values is being checked to discard transmission errors.<br>
Parsed data is displayed in the log and in the graph.<br>

## Binary:
If hoverboard is communicating through Binary Serial Protocol, messages are being parsed and checksum is validated to discard transmission errors.<br>
Parsed data is displayed in the log and in the graph.<br>
The tool will also send binary commands to control the hoverboard (Speed/steer).<br>
