1. Deskripsi tugas:
	Membangun IoT Node, IoT Server, dan IoT Client-Berbasis-Web
   Spesifikasi tugas:
	- Digital Input => Push Button yang terhubung LED, namun tidak terhubung dengan IoT Client karena kami kira tidak perlu terhubung
	- Digital Output => LED yang akan menyala baik dalam mode manual (Push button fisik/web ditekan) atau otomatis (temperatur melebihi threshod) => Berhasil
        - Analog Input => Sensor temperatur, tekanan, kelembapan => Berhasil
	- Analog Output => LED yang intensitasnya berubah baik dalam mode manual (Slider web digeser) atau otomatis (berdasarkan kelembapan)
=> Berhasil
	- Display gauge tiap satu detik => Berhasil
	- Display chart selama 5 menit => Berhasil
	- Display rata-rata sensor selama 5 menit => Berhasil
	- Mengatur threshold digital/analog output => Berhasil

2. Komponen elektronik:
	- WEMOS D1 MINI
	- Sensor temperatur, tekanan, dan kelembapan BME280
	- LED (3)
	- 4 Pin push button
	- Resistor 220 Ohm (3)
	- Jumper male to male (10)
	- Breadboard
	- Kabel tipe C

3. Cara menjalankan kode:
	- IOT Server => node index.js
	- IOT Client => buka halaman 192.168.0.101:3000
	- IOT Node => Upload kode ke wemos

4. Anggota kelompok dan kontribusinya:
	Fajar Adi Nugroho => Back end
	Ngakan Putu Gede Amartya Kumara Sayang => Front end
	Tommy Partogi Simamora => Front end
