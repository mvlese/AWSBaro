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

var math = require('mathjs');
var mraa = require('mraa'); //require mraa
var lcdSerial = require('./lcdSerial');
//var baro = new (require('jsupm_bmpx8x')).BMPX8X(0, 0x77);
var sensorObj = require('jsupm_bmp280');
var sensor = new sensorObj.BME280();

var i2c = new mraa.I2c(0, false);

//var digitalAccelerometer = require('jsupm_h3lis331dl');
var lightSensor = require('jsupm_tsl2561');
var myLightSensor = new lightSensor.TSL2561();

// Instantiate an H3LIS331DL on I2C bus 0
//var myDigitalAccelerometer = new digitalAccelerometer.H3LIS331DL(
//    digitalAccelerometer.H3LIS331DL_I2C_BUS, 
//    digitalAccelerometer.H3LIS331DL_DEFAULT_I2C_ADDR);
//var myDigitalAccelerometer = new digitalAccelerometer.H3LIS331DL(0, 0x18);

//myDigitalAccelerometer.init();

var myThingName = 'intel_galileo';

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

function sleep(delay) {
  delay += new Date().getTime();
  while (new Date() < delay) { }
}

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
//baro.init();

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

    i2c.address(0x29);
    i2c.writeReg(0x81, 0x21);

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
};

var test = true;

function roundNum(num, decimalPlaces)
{
	var extraNum = (1 / (Math.pow(10, decimalPlaces) * 1000));
	return (Math.round((num + extraNum) * (Math.pow(10, decimalPlaces))) / Math.pow(10, decimalPlaces));
}

function doNothing() {
    test = !test;
 
    var timeStamp = Math.floor(Date.now() / 1000);
    
//    baro.update();
//    var localPressure = baro.getSealevelPressure(247) * 0.000295333727;
//    console.log("Pressure: " + localPressure.toString().substring(0, 5));
//    var temperature = baro.getTemperature() * 1.8 + 32.0;
//    console.log("Temperature: " + temperature.toString().substring(0, 4));
    sensor.update();
    var humidity = sensor.getHumidity();
    console.log("Humidity: " + humidity.toString().substring(0, 4));
    var temperatureC = sensor.getTemperature();
    console.log("Temperature: " + temperatureC.toString().substring(0, 4) + " C");
    var temperatureF = sensor.getTemperature(true);
    console.log("Temperature: " + temperatureF.toString().substring(0, 4) + " F");
    var altitude = sensor.getAltitude();
    console.log("Computed Altitude: " + altitude + " m");
    var pressure = sensor.getPressure();
    console.log("Pressure: " + pressure.toString().substring(0, 5));
    var seaLevelPressure = pressure * (math.pow(1 - ((0.0065 * 247) / (temperatureC + (0.0065 * 247) + 273.15)), -5.257)) * 0.000295333727;
    console.log("Sea Level Pressure: " + seaLevelPressure.toString().substring(0, 5));
    
    i2c.address(0x29);
    var chipId = i2c.readReg(0x12 + 0x80);
    console.log("Chip ID: 0x" + chipId.toString(16));
    var ch0 = i2c.readWordReg(0x14 + 0x80);
    var ch1 = i2c.readWordReg(0x16 + 0x80);
    console.log("Ch 0: " + ch0.toString());
    console.log("Ch 1: " + ch1.toString());

    //var lux = myLightSensor.getLux();
    //console.log("LUX: " + lux.toString());
    setTimeout(doNothing, 5000);
}


