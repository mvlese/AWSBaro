/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:false */
// Leave the above lines for propper jshinting

/*
    The UART - Serial sample application distributed within Intel® XDK IoT Edition under the IoT with Node.js Projects project creation option showcases how to find the general-purpose transistor-transistor logic(TTL)-level port, read and write data.

    MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
    Library in C/C++ to interface with Galileo & other Intel platforms, in a structured API with port names/numbering that match compatible boards & with bindings to javascript.

    Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image and an active internet connection
    Using a ssh client: 
    1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
    2. opkg update
    3. opkg upgrade

    Article: https://software.intel.com/en-us/node-js-templates-for-intel-xdk-iot-edition

    Review the README.md for more information about getting started with a sensor.
*/


var mraa = require('mraa'); //require mraa
var lcdSerial = require('./lcdSerial');
var baro = new (require('jsupm_bmpx8x')).BMPX8X(0, 0x77);

var awsIot = require('aws-iot-device-sdk');

var myThingName = 'intel_galileo';

var device = awsIot.device({
   keyPath: '/home/root/certs/intel_galileo.private.key',   // path of private key - change the name accourding to your key name
  certPath: '/home/root/certs/intel_galileo.cert.pem', // path of certificate - change the name accourding to your cert name
    caPath: '/home/root/certs/root-CA.crt',  // path of root file
  clientId: myThingName,
      host: 'a5j04p9vbqydc.iot.us-west-2.amazonaws.com',
    region: 'us-west-2'  // your region
});


//var sp = require('serialport');
console.log('MRAA Version: ' + mraa.getVersion()); //print out the mraa version in IoT XDK console

//Intel(R) Edison & Intel(R) Galileo 
var u = new mraa.Uart(0); //Default
//Name:     UART1, the general-purpose TTL-level port (Arduino shield compatibility)
//Location: Pins 0 (RX) and 1 (TX) on the Arduino shield interface headers or the UART slot on the Grove Starter Kit Base Shield
var serialPath = u.getDevicePath(); //Default general purpose port "/dev/ttyMFD1" - Intel(R) Edison; "/dev/ttyS0" - Intel(R) Galileo
console.log(serialPath);

//Name:     “Multi-gadget” or “Firmware Programming” or "Arduino Serial console" or "OTG" port
//Location: USB-micro connector near center of Arduino board.  - Intel(R) Edison
//var serialPath = "/dev/ttyGS0"; 

//Name:     UART2
//Location: USB-micro connector near edge of Arduino board. - Intel(R) Edison
//var serialPath = "/dev/ttyMFD2";

var waterValve = new mraa.Gpio(7);
waterValve.dir(mraa.DIR_OUT);
waterValve.write(0);

function sleep(delay) {
  delay += new Date().getTime();
  while (new Date() < delay) { }
}

//setup access analog input Analog pin #0 (A0)
var analogPin0 = new mraa.Aio(0); 
var analogValue = 0;

var x = u.setBaudRate(9600);

var ipAddress = "";
var networkInterfaces = require('os').networkInterfaces();

//enp0s20f6
// wlp1s0
for (var n = 0; n < networkInterfaces.enp0s20f6.length; n++) {
    if (networkInterfaces.enp0s20f6[n].family == 'IPv4') {
        ipAddress = networkInterfaces.enp0s20f6[n].address;
    }
}
console.log(ipAddress);
baro.init();

var rslt = lcdSerial.init(u);
if (rslt === true) {
    console.log("inited");
    lcdSerial.displayOn();
    lcdSerial.backlightOn();
    lcdSerial.returnHome();
    //lcdSerial.cursorOn();
    lcdSerial.setCursor(1, 0);
    lcdSerial.writeStr("Water on! ");
    sleep(1000);
    //lcdSerial.backlightOff();
    //lcdSerial.cursorOff();

    lcdSerial.setCursor(0, 0);
    lcdSerial.writeStr(ipAddress);

    doNothing();
} else {
    console.log("could not init");
}

mythingstate = {
  "state": {
    "reported": {
      "LocalIP": "unknown"
    }
  }
}

var deviceConnected = false;

device
    .on ('connect', function() {
        console.log('connect');
        device.subscribe('topic_1');
        device.subscribe('weather_echo');
        device.publish('topic_2', JSON.stringify({ test_data: 1, string_data: 'mark lese'}));
        deviceConnected = true;
    });

device
    .on ('message', function(topic, payload) {
        console.log('message', topic, payload.toString());
    });


var test = true;

function doNothing() {
    test = !test;
    if (test) {
        //lcdSerial.displayOff();
        waterValve.write(1);
    } else {
        //lcdSerial.displayOn();
        waterValve.write(0);
    }
    analogValue = analogPin0.read();
    lcdSerial.setCursor(0, 0);
    var temp = "    " + analogValue.toString();
    lcdSerial.setCursor(1, 0);
    lcdSerial.writeStr("Water on! " + temp.substring(temp.length - 4));
    
    var timeStamp = Math.floor(Date.now() / 1000);
    
    baro.update();
    var localPressure = baro.getSealevelPressure(247) * 0.000295333727;
    console.log("Pressure: " + localPressure.toString().substring(0, 5));
    var temperature = baro.getTemperature() * 1.8 + 32.0;
    console.log("Temperature: " + temperature.toString().substring(0, 4));
    
    if (deviceConnected == true) {
        device.publish('lese_weather', JSON.stringify({ 
                pressure: localPressure.toString().substring(0, 5), 
                temperature: temperature.toString().substring(0, 4) 
            }));
    }
    setTimeout(doNothing, 5000);
}


