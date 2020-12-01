# Hoverboard-Web-Serial-Control

Experiment to control hoverboard via Serial with Webserial.
Works with serial protocol in following firmware:<br />
https://github.com/EmanuelFeru/hoverboard-firmware-hack-FOC

## Ascii:
If hoverboard is communicating through ASCII Serial debug, messages are being parsed and number of values is being checked to discard transmission errors.<br>
Parsed data is displayed in the log and in the graph.<br>

## Binary:
If hoverboard is communicating through Binary Serial Protocol, messages are being parsed and checksum is validated to discard transmission errors.<br>
Parsed data is displayed in the log and in the graph.<br>
The tool can also send binary commands to control the hoverboard.<br>

## Prerequisite
This flag has to be enabled:<br>
chrome://flags/#enable-experimental-web-platform-features<br>
opera://flags/#enable-experimental-web-platform-features<br>
edge://flags/#enable-experimental-web-platform-features<br>

Open this link to access the webpage<br>
https://candas1.github.io/Hoverboard-Web-Serial-Control/


