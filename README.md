# Hoverboard-Web-Serial-Control

Web tool to control hoverboard, log and plot output data through a simple webpage.<br>
The tool doesn't need installation and is accessible via this link.<br>
https://candas1.github.io/Hoverboard-Web-Serial-Control/

It works with USART serial protocol and USART DEBUG in following firmware:<br>
https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC

The APIs are only supported on chromium based browsers like Chrome or Edge.

From a computer, you can use both WEB Serial API and WEB Bluetooth API.<br>
From mobile, only WEB Bluetooth API is supported (not supported on IOS).

## APIs
### WEB Serial API:
The tool is using [Web Serial API](https://web.dev/serial/) to connect to the hoverboard through a COM port of your PC(FTDI,Bluetooth 2.0,...).<br>
Select the required baud rate, click on connect button, and select the COM port corresponding to your FTDI/Bluetooth 2.0 device(e.g. HC-05).

### WEB Bluetooth API:
The tool is using [Web Bluetooth API](https://web.dev/bluetooth/) to connect to Bluetooth BLE devices (e.g. AT-09, HM-10...).<br>
Make sure you [configured](https://github.com/Candas1/Hoverboard-Web-Serial-Control/wiki/Configure-BLE-device) your BLE device with the right baud rate.
Click on connect button and select the right BLE device.

Serial over Classic bluetooth is not supported by this API yet but might be [implemented](https://bugs.chromium.org/p/chromium/issues/detail?id=1043300) in the future.

## Terminal
This view let's you visualize incoming Ascii and Binary messages:<br>
* Pausing will stop automatic scrolling

If stats are enabled, you can visualize following information:<br>
* Buffer write and read offset
* Number of successful messages
* Skipped Bytes
* Errors

In Ascii mode, commands can also be sent (can be used with [debug protocol](https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC/wiki/Debug-Serial#debug-protocol) of FOC firmware)

### Receive - Ascii:
If hoverboard is communicating through [ASCII Serial debug](https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC/wiki/Debug-Serial) (parameter DEBUG_SERIAL_USARTX should be enabled), messages in following format will be parsed and displayed in the log and in the chart.<br>
`in1:345 in2:1337 cmdR:0 cmdL:0 BatADC:0 BatV:0 TempADC:0 Temp:0\n`<br>
Other messages (first word not containing ':' ) will be simply displayed in the log.

### Receive - Binary:
For use when parameter FEEDBACK_SERIAL_USARTX is enabled in FOC Firmware.<br>
Feedback is received through [this](https://github.com/EFeru/hoverboard-firmware-hack-FOC/wiki/Variant-USART#feedback) Binary Serial Protocol.

Messages are being parsed and checksum is validated to discard transmission errors.<br>
Parsed data is displayed in the log and in the graph.<br>

## Chart
This view let's you visualize a plot of received values:
* click on the legend to hide/show the values
* pause and scroll left to see old values

If subplots are enabled, each value will be visualized on a different axis.<br>

## Control
This view will display a virtual RC remote to control the hoverboard if you use variant USART or IBUS.<br>
You can use the mixer setting to assign the desired joystick.

### Protocol - Usart:
For use when parameter CONTROL_SERIAL_USARTX is enabled in FOC Firmware, with the [USART variant](https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC/wiki/Variant-USART) or [DUAL INPUTS](https://github.com/EFeru/hoverboard-firmware-hack-FOC#dual-inputs).<br>
It will not work with parameter SIDEBOARD_SERIAL_USARTX as it's a different protocol(See Hovercar protocol).<br>
The tool sends binary commands to control the hoverboard (Speed/steer) via the virtual controller with [this](https://github.com/EFeru/hoverboard-firmware-hack-FOC/wiki/Variant-USART#input-command-structure) Binary Serial Protocol.

### Protocol - Hovercar:
For use when parameter SIDEBOARD_SERIAL_USARTX is enabled in FOC Firmware, with the [Hovercar variant](https://github.com/EFeru/hoverboard-firmware-hack-FOC/wiki/Variant-HOVERCAR), [USART variant](https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC/wiki/Variant-USART), or [DUAL INPUTS](https://github.com/EFeru/hoverboard-firmware-hack-FOC#dual-inputs).<br>
The tool sends binary commands to control the hoverboard via the virtual controller with [this](https://github.com/EFeru/hoverboard-firmware-hack-FOC/issues/143#issuecomment-782149767) Binary Serial Protocol:
* Speed (Vertical axis of the joystick selected in the mixer)
* Steer (Horizontal axis of the joystick selected in the mixer)
* ON/OFF : to switch back to control with pedals(ADC) when using Hovercar variant in dual input mode
* Type : let's you switch between Commutation, Sinoisoidale and FOC
* Mode : let's you switch between Torque, Speed and Voltage mode
* FW : let's turn Field Weakening ON and OFF

### Protocol - Ibus:
For use with the [IBUS variant](https://github.com/EFeru/hoverboard-firmware-hack-FOC/wiki/Variant-IBUS) or [DUAL INPUTS](https://github.com/EFeru/hoverboard-firmware-hack-FOC#dual-inputs) of FOC firmware.<br>
The tool sends Flysky Ibus frames to control the hoverboard via the virtual controller:
* Speed (Vertical axis of the joystick selected in the mixer) (channel 1)
* Steer (Horizontal axis of the joystick selected in the mixer) (channel 2)
* Switch A (channel 7)
* Switch B (channel 8)
* Switch C (channel 9)
* Switch D (channel 10)

Please note that FOC firmware is only using joytick values.<br>

This mode is not working with BLE yet because of limitation of message size (20 bytes). It will probably be fixed when Chrome team implements [Exchange MTU](https://bugs.chromium.org/p/chromium/issues/detail?id=1164621#c10)


## TODO
* Bluetooth
  * [ ] Improve stability, automatically reconnect

* Terminal view
  * [X] Possibility to select a different protocol for sending and receiving (e.g. sending UART binary but receiving ASCII debug
  * [X] Auto autoscroll
  * [ ] App is freezing when returning to the terminal view and too many logs accumulated

* Chart view
  * [X] Hidding a chart variable in subplot mode should hide the corresponding axis also
  * [ ] Possibility to dowload csv file
  
* Control view
  * [X] Possibility to use Sideboard protocol for sending commands
  * [X] Switches for sideboard/ibus protocol
  * [ ] Hold mode to hold command even after release of the joystick during tests

* Dash view 
  * [X] Power consumption missing from FOC firmware (alternate protocol)
  * [ ] Battery capacity in %
  * [ ] Setting for wheel radius to have accurate speed KM/H
  

* New views
  * [ ] Interface for configuring the firmware (missing in firmware also)
  * [ ] Settings view to be able to customize the tool ( refresh frequencies, serial frame structure, ... )

