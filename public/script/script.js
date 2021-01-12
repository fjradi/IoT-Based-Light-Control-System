// Server and broker address
const brokerAddress = '192.168.0.101';
const serverPort = '3000';

// MQTT Setup
var client = mqtt.connect('ws:'+brokerAddress+':'+serverPort);

// Initialization before data received from broker
var nodeLedState = false;     // LED state from node
var webLedState = false;      // LED state from web  
var led;
var temperature = [];
var temperature_sum = 0;
var pressure = [];
var pressure_sum = 0;
var humidity = [];
var humidity_sum = 0;
var isAuto = false;         // Auto mode var
var isStop = false;         // Alarm stop var
var threshold = 30;         // Digital LED threshold

// Run when connected (continuous)
client.on('connect', function() {
    console.log('client connected at %s:%s',brokerAddress);
    client.subscribe('topic/temperature');
    client.subscribe('topic/pressure');
    client.subscribe('topic/humidity');
    client.subscribe('topic/button');
    client.subscribe('topic/digitalLed');
});

// Run when message received
client.on('message', function(topic, message) { 
    switch (topic) {
        case 'topic/temperature': changeValue(message,"temperature_value"); break;
        case 'topic/pressure': changeValue(message,"pressure_value"); break;
        case 'topic/humidity': changeValue(message,"humidity_value"); break;
        case 'topic/digitalLed' : changeLED(message,"digital_led_button", "web"); break;
        case 'topic/button': changeLED(message, "digital_led_button", "node"); break;
    }
});

// Update HTML when message received
function changeValue(value,value_id) {
    // Update HTML content
    document.getElementById(value_id).innerHTML = value;

    // Update chart and gauge
    d = new Date();
    var timeNow = d.getHours()+':'+d.getMinutes()+':'+d.getSeconds(); // Get current time
    switch (value_id) {
        case 'temperature_value':
            temperature_gauge.set(value);                                // Update gauge
            if (value >= threshold && !isStop){                         // If temperature >= threshold
                document.getElementById(value_id).style.color = 'red';  // Change display text to red
                PlaySound();                                            // Play alarm sound
            }
            else                                                        // Else (if temperature < threshold)
                document.getElementById(value_id).style.color = 'white';// Change display text back to white

            if (config[0].data.datasets[0].data.length > 300) {         // If there are more 300 data (after 5 mins)
                temperature_sum = temperature.slice().reduce((previous, current) => current += previous)  // Get sum of temp data;
                document.getElementById('temperature_avg_value').innerHTML = (Math.round(temperature_sum/temperature.length*1000)/1000).toString();
                console.log("rata-rata %f", temperature_sum/temperature.length);
                temperature.shift();                     // Shift temperature data,
                config[0].data.datasets[0].data.shift(); // Shift temperature data (on chart),
                config[0].data.labels.shift();           // Shift date data,
            }
            temperature.push(parseInt(value))           // Push current temp val to temp data array
            config[0].data.labels.push(timeNow)         // Current time as chart label
            config[0].data.datasets[0].data.push(value).toFixed(2)
            mychart1.update();
            break;
        case 'pressure_value':
            pressure_gauge.set(value)
            if (config[1].data.datasets[0].data.length > 300) {
                pressure_sum = pressure.slice().reduce((previous, current) => current += previous)
                document.getElementById('pressure_avg_value').innerHTML = (Math.round(pressure_sum / pressure.length*1000)/1000).toString()
                console.log("rata-rata %f", pressure_sum / pressure.length)
                pressure.shift()
                config[1].data.datasets[0].data.shift()
                config[1].data.labels.shift()
            }
            pressure.push(parseInt(value))
            config[1].data.labels.push(timeNow)
            config[1].data.datasets[0].data.push(value).toFixed(2)
            mychart2.update();
            break;
        case 'humidity_value':
            humidity_gauge.set(value)
            if (config[2].data.datasets[0].data.length > 300) {
                humidity_sum = humidity.slice().reduce((previous, current) => current += previous)
                document.getElementById('humidity_avg_value').innerHTML = (Math.round(humidity_sum / humidity.length*1000)/1000).toString()
                console.log("rata-rata %f", humidity_sum / humidity.length)
                humidity.shift()
                config[2].data.datasets[0].data.shift()
                config[2].data.labels.shift()
            }				
            humidity.push(parseInt(value))
            config[2].data.labels.push(timeNow)
            config[2].data.datasets[0].data.push(value).toFixed(2)
            mychart3.update();
            break;
    }
}

// Update LED value with received state
function changeLED(state,led_id, source){ // Change LED on message received

    // Change current LED state var
    if (source == "web")
        webLedState = state.toString('utf-8');
    else
        nodeLedState = state.toString('utf-8');

    // Change color on state change
    if (webLedState == "true" || nodeLedState == "true"){
        document.getElementById(led_id.toString('utf-8')).style.backgroundColor = "rgb(46, 204, 113)";
        document.getElementById(led_id.toString('utf-8')).innerHTML = "ON"
    }
    else{
        document.getElementById(led_id.toString('utf-8')).style.backgroundColor = "rgb(231, 76, 60)";
        document.getElementById(led_id.toString('utf-8')).innerHTML = "OFF"
    }
    // switch (state.toString('utf-8')) {
    //     case 'false': // LED Mati (Merah)
    //         document.getElementById(led_id.toString('utf-8')).style.backgroundColor = "rgb(231, 76, 60)"; 
    //         document.getElementById(led_id.toString('utf-8')).innerHTML = "OFF"
    //         break;
    //     case 'true': // LED Nyala (Hijau)
    //         document.getElementById(led_id.toString('utf-8')).style.backgroundColor = "rgb(46, 204, 113)";
    //         document.getElementById(led_id.toString('utf-8')).innerHTML = "ON"
    //         break;
    //     default: // Data Invalid
    //         document.getElementById(led_id.toString('utf-8')).style.backgroundColor = "white";
    //         break;
    // }
}

// Publish LED state when button pressed (toggle)
function changeLEDButton() {
    console.log("Button clicked")
    
    led = webLedState; // Get previous web LED state

    // Toggle LED state and publish
    if(led.toString('utf-8') == 'false'){           // If previous LED state off
        client.publish("topic/digitalLed", 'true')  // Publish manual digital LED topic (ON)
    }
    else{                                           // Else (if previous LED state on)
        client.publish("topic/digitalLed",'false')  // Publish manual digital LED topic (OFF)
    }
}

// Slider
var slider = document.getElementById("analog_led_slider");          // Slider html element
var output = document.getElementById("analog_led_value");           // Display text from slider html element
output.innerHTML = slider.value;                                    // Display the default slider value (0)

slider.oninput = function () {  // Update the current slider value (each time you drag the slider handle)
    output.innerHTML = this.value;                                  // Change slider display text
    console.log('analog LED updated to %d', this.value)
    client.publish('topic/analogLed', this.value.toString('utf-8')) // Publish manual analog LED topic
} 

//Chart
var ctx1 = document.getElementById('canvas1').getContext('2d');
var ctx2 = document.getElementById('canvas2').getContext('2d');
var ctx3 = document.getElementById('canvas3').getContext('2d');
var config = [
    {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Temperature',
            backgroundColor: 'rgb(46, 204, 113)',
            borderColor: 'rgb(46, 204, 113)',
            data: [],
            fill: false,
        }]
    }
},
{
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Pressure',
            backgroundColor: 'rgb(46, 204, 113)',
            borderColor: 'rgb(46, 204, 113)',
            data: [],
            fill: false,
        }]
    }
},
{
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Humidity',
            backgroundColor: 'rgb(46, 204, 113)',
            borderColor: 'rgb(46, 204, 113)',
            data: [],
            fill: false,
        }]
    }
}];

var mychart1 = new Chart(ctx1, config[0]);
var mychart2 = new Chart(ctx2, config[1]);
var mychart3 = new Chart(ctx3, config[2]);

// Gauge
var opts = {
    angle: 0.15, // The span of the gauge arc
    lineWidth: 0.44, // The line thickness
    radiusScale: 1, // Relative radius
    pointer: {
        length: 0.6, // // Relative to gauge radius
        strokeWidth: 0.035, // The thickness
        color: '#000000' // Fill color
    },
    limitMax: false,     // If false, max value increases automatically if value > maxValue
    limitMin: false,     // If true, the min value of the gauge will be fixed
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // just experiment with them
    strokeColor: '#E0E0E0',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support
    percentColors: [[0.0, "#a9d70b"], [0.50, "#f9c802"], [1.0, "#ff0000"]]

};
var temperature_target = document.getElementById('temperature_gauge'); // temp canvas element
var temperature_gauge = new Gauge(temperature_target).setOptions(opts); // create temp gauge
temperature_gauge.maxValue = 45; // set max temp gauge value
temperature_gauge.setMinValue(15);  // Prefer setter over gauge.minValue = 0
temperature_gauge.animationSpeed = 21; // set animation speed (32 is default value)
temperature_gauge.set(0); // set actual value

var humidity_target = document.getElementById('humidity_gauge');
var humidity_gauge = new Gauge(humidity_target).setOptions(opts);
humidity_gauge.maxValue = 100;
humidity_gauge.setMinValue(0);
humidity_gauge.animationSpeed = 21;
humidity_gauge.set(0);

var pressure_target = document.getElementById('pressure_gauge');
var pressure_gauge = new Gauge(pressure_target).setOptions(opts);
pressure_gauge.maxValue = 1000;
pressure_gauge.setMinValue(500);
pressure_gauge.animationSpeed = 21;
pressure_gauge.set(0);

// Auto Mode
function auto() {
    isAuto = !isAuto;

    // Check auto mode
    if (isAuto) {                                 // If auto mode turned on
        console.log('Auto Mode is ON')
        document.getElementById("autoButton").style.backgroundColor = "rgb(46, 204, 113)"; // Change auto mode button color to green 
        client.publish("topic/autoMode", 'true') // Publish auto mode topic (ON)
    }
    else {                                          //Else (if auto mode turned off)
        console.log('Auto Mode is OFF')
        document.getElementById("autoButton").style.backgroundColor = "rgb(231, 76, 60)"; // Change auto mode button color to red 
        client.publish("topic/autoMode", 'false')   // Publish auto mode topic (OFF)
    }
}

// Digital LED threshold
function digitalLedThreshold() {
    threshold = document.getElementById("digital_led_threshold").value;
    console.log('Threshold is set on %d', threshold)
    client.publish("topic/digitalLedThreshold", threshold.toString('utf-8'));
}

// Min analog LED threshold
function minAnalogLedThreshold() {
    var minThreshold = document.getElementById("min_analog_led_threshold").value;
    console.log('Min Threshold is set on %d', minThreshold)
    client.publish("topic/minAnalogLedThreshold", minThreshold.toString('utf-8'));
}

// Max analog LED threshold
function maxAnalogLedThreshold() {
    var maxThreshold = document.getElementById("max_analog_led_threshold").value;
    console.log('Max Threshold is set on %d', maxThreshold)
    client.publish("topic/maxAnalogLedThreshold", maxThreshold.toString('utf-8'));
}

// Play alarm sound
function PlaySound() {
    var sound = document.getElementById("audio");
    sound.play()
}

// Stop/resume alarm sound
function stopAlarm(){
    isStop = !isStop;
    console.log(isStop)
}