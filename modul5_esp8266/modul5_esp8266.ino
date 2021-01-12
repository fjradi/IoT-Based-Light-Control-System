//=========LIBRARIES==============================
//========ESP8266 and MQTT Library================
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
//==========Sensor Library=======================
#include <Wire.h>
#include <SPI.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
//=========VARIABLES=========================
//==========MQTT variables=====================
// Update these with values suitable for your network.
const char* ssid = "Andromax-M3Z-E016";
const char* password = "30807993";
const char* mqtt_server = "192.168.0.101";

WiFiClient espClient;
PubSubClient client(espClient);

long lastMsg = 0;
String msg, msgtopic;
char msg1[50];
char msg2[50];
char msg3[50];
int temperature, pressure, humidity;
//============Sensor variables===============
#define BME_SCK 13
#define BME_MISO 12
#define BME_MOSI 11
#define BME_CS 10

#define SEALEVELPRESSURE_HPA (1013.25)

Adafruit_BME280 bme; // I2C
//============Pin variables=============
const int digitalLedPin = D0;
const int buttonPin = D8;
const int analogLedPin = 13;
//===========Another variables===========
bool digitalLed_ = 0;
int analogLed_;
bool isAuto;
int digitalLedThreshold = 30, minAnalogLedThreshold = 30, maxAnalogLedThreshold = 70;
//=========FUNCTION===================
//========MQTT Function===============
void setup_wifi() {
  // We start by connecting to a WiFi network
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  // Waiting until connected
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  randomSeed(micros());

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on topic ");
  Serial.print(topic);
  Serial.print(": ");
  msgtopic = String((char*)topic);
  msg = "";
  for (int i = 0; i < length; i++) { // Concat payload char to string (msg)
    msg += (char)payload[i];
  }
  Serial.println(msg);
  if(msgtopic == "topic/digitalLed"){ // If LED button from website toggled
    if(msg == "true"){
      digitalLed_ = 1;
      Serial.println("digital LED ON (from website)");
    }
    else {
      digitalLed_ = 0;
      Serial.println("digital LED OFF (from website)");
    }
  }
  if(msgtopic == "topic/analogLed"){ // If LED slider from website changed
    Serial.println("analog LED "+msg+" percent");
    analogLed_ = msg.toInt(); 
  }
  if(msgtopic == "topic/autoMode"){ // If auto mode turned on
    if (msg == "true"){
      isAuto = true;
      Serial.println("Auto Mode is ON");
    }
    else{
      isAuto = false;
      Serial.println("Auto Mode is OFF");
    }
  }
  if (msgtopic == "topic/digitalLedThreshold"){ //If digital LED Threshold changed
    digitalLedThreshold = msg.toInt();
  }
  if (msgtopic == "topic/minAnalogLedThreshold"){ // If min analog LED Threshold changed
    minAnalogLedThreshold = msg.toInt();
  }
  if (msgtopic == "topic/maxAnalogLedThreshold"){ // if max LED Threshold changed
    maxAnalogLedThreshold = msg.toInt();
  }
}

void reconnect() {
  // Loop until we're reconnected
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    
    // Create a random client ID
    String clientId = "ESP8266Client-";
    clientId += String(random(0xffff), HEX);
    
    // Attempt to connect
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      client.publish("topic/temperature", "0"); // Send first confirmation message if connected
      client.publish("topic/pressure", "0");
      client.publish("topic/humidity", "0");
      client.publish("topic/button", "false");          // Manual digital input from node topic
      client.subscribe("topic/digitalLed");             // Manual digital input from website topic
      client.subscribe("topic/analogLed");              // Manual analog input from website topic
      client.subscribe("topic/autoMode");               // Auto mode topic
      client.subscribe("topic/digitalLedThreshold");    // Digital LED threshold topic 
      client.subscribe("topic/minAnalogLedThreshold");  // Min analog LED threshold topic
      client.subscribe("topic/maxAnalogLedThreshold");  // Max analog LED threshold topic
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      
      // Wait 5 seconds before retrying
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  //====MQTT Setup=====
  pinMode(LED_BUILTIN, OUTPUT);
  setup_wifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  //=====Sensor Setup======
  unsigned status;
  // default settings
  // (you can also pass in a Wire library object like &Wire2)
  status = bme.begin();  
  if (!status) {
    Serial.println("Could not find a valid BME280 sensor, check wiring, address, sensor ID!");
    Serial.print("SensorID was: 0x"); Serial.println(bme.sensorID(),16);
    Serial.print("        ID of 0xFF probably means a bad address, a BMP 180 or BMP 085\n");
    Serial.print("   ID of 0x56-0x58 represents a BMP 280,\n");
    Serial.print("        ID of 0x60 represents a BME 280.\n");
    Serial.print("        ID of 0x61 represents a BME 680.\n");
    while (1);
 }
 //=====Pin Setup======
 pinMode(digitalLedPin, OUTPUT);  
 pinMode(buttonPin, INPUT);
 pinMode(analogLedPin, OUTPUT);
}

void loop() {

  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 1000) { // Get sensor value every 1 secs
    lastMsg = now;
    temperature = bme.readTemperature();
    pressure = bme.readPressure() / 100.0F;
    humidity = bme.readHumidity();
    if (isAuto){                                // If auto mode turned on
      if (temperature >= digitalLedThreshold)   // if temperature >= threshold
        digitalWrite(digitalLedPin, HIGH);      // Turn on digital LED
      else                                      // Else (if temperature < threshold)
        digitalWrite(digitalLedPin, LOW);       // Turn off digital LED
      analogWrite(analogLedPin, map(humidity, minAnalogLedThreshold, maxAnalogLedThreshold, 0, 1023)); // Change analog LED intensity by threshold
    }                                                                                                  // (min threshold = 0, max = 1023_
    else{                                                   // If Auto Mode turned off
      if (digitalRead(buttonPin) == HIGH){                  // If button from node ON
        digitalWrite(digitalLedPin, HIGH);                  // Turn on digital LED
        client.publish("topic/button", "true");             // Publish button status (ON)
        Serial.println("digital LED ON (from node)");
      } 
      else if (digitalLed_){                                // If button from website ON
        digitalWrite(digitalLedPin, HIGH);                  // Turn on digital LED,
        client.publish("topic/button", "false");            // Publish button status (OFF)
        Serial.println("digital LED OFF (from node)");
      }
      else                                                  // Else (if button from website and Node OFF)
        digitalWrite(digitalLedPin, LOW);                   // Tturn off digital LED
      analogWrite(analogLedPin, map(analogLed_, 0, 100, 0, 1023));  // Change analog LED intensity by slider
    }                                                               // (slider 0 = 0, 100 = 1023)
    snprintf (msg1, 50, "%d", temperature);
    snprintf (msg2, 50, "%d", pressure);
    snprintf (msg3, 50, "%d", humidity);
    Serial.print("Publish message: ");
    Serial.print(msg1);
    Serial.print("*C | ");
    Serial.print(msg2);
    Serial.print("hPa | ");
    Serial.print(msg3);
    Serial.println("%");
    client.publish("topic/temperature", msg1);          // Publsih temperature value
    client.publish("topic/pressure", msg2);             // Publish pressure value
    client.publish("topic/humidity", msg3);             // Publish humidity value
  }
}
