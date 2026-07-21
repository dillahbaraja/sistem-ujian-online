# UAS Pemrograman Berorientasi Objek Semester II

**Program Studi:** Teknik Informatika  
**Fakultas:** Teknik Elektro dan Informatika  
**Universitas:** Universitas Surakarta  
**Mata Kuliah:** UAS Pemrograman Berorientasi Objek Semester II  
**Target:** Mahasiswa Semester II  

## Petunjuk Umum

- Semua soal pada bank ini adalah pilihan ganda tunggal.
- Pilih satu jawaban yang paling tepat untuk setiap soal.
- Fokus soal ada pada pemahaman class, object, method, constructor, inheritance, encapsulation, dan return value.
- Setiap soal disertai penjelasan singkat untuk membantu proses belajar.

---

## Soal Pilihan Ganda Tunggal

### 1.
Dalam pemrograman Java, `class` paling tepat dipahami sebagai:

A. Data hasil eksekusi program  
B. Cetak biru untuk membuat object  
C. Nilai sementara di memori  
D. Perintah untuk menampilkan output

**Penjelasan:**  
Class menyimpan rancangan atribut dan method yang akan dipakai object.

### 2.
Ketika kita menulis `Mahasiswa m1 = new Mahasiswa();`, bagian `m1` disebut:

A. Package  
B. Method  
C. Object reference  
D. Constructor

**Penjelasan:**  
Variabel tersebut menyimpan referensi menuju object yang dibuat dengan `new`.

### 3.
Perhatikan method berikut:

```java
void tampilkanNama() {
    System.out.println("Budi");
}
```

Jenis method tersebut adalah:

A. Void method  
B. Static method  
C. Abstract method  
D. Recursive method

**Penjelasan:**  
Method `void` tidak mengembalikan nilai ke pemanggil.

### 4.
Method constructor pada class digunakan untuk:

A. Menghapus object  
B. Menginisialisasi object saat dibuat  
C. Menampilkan isi array  
D. Menghitung nilai return

**Penjelasan:**  
Constructor berjalan otomatis ketika object dibentuk.

### 5.
Konsep OOP yang menyembunyikan data dan hanya membuka akses melalui method tertentu adalah:

A. Inheritance  
B. Polymorphism  
C. Overloading  
D. Encapsulation

**Penjelasan:**  
Encapsulation menjaga data agar tidak diakses langsung sembarangan.

### 6.
Jika sebuah field hanya boleh diakses dari dalam class itu sendiri, access modifier yang tepat adalah:

A. public  
B. protected  
C. private  
D. default

**Penjelasan:**  
`private` membatasi akses paling ketat pada class yang sama.

### 7.
Class `Dosen` mewarisi atribut dan method dari class `Pegawai`. Hubungan ini disebut:

A. Composition  
B. Inheritance  
C. Abstraction  
D. Casting

**Penjelasan:**  
Inheritance memungkinkan class turunan memakai perilaku dari class induk.

### 8.
Kemampuan satu interface method untuk memiliki perilaku berbeda pada object yang berbeda disebut:

A. Polymorphism  
B. Aggregation  
C. Encapsulation  
D. Instantiation

**Penjelasan:**  
Polymorphism membuat pemanggilan method dapat menghasilkan perilaku berbeda tergantung object-nya.

### 9.
Perhatikan potongan kode berikut:

```java
int luas(int p, int l) { return p * l; }
int luas(int s) { return s * s; }
```

Teknik yang digunakan adalah:

A. Overriding  
B. Casting  
C. Overloading  
D. Looping

**Penjelasan:**  
Nama method sama, tetapi parameter berbeda.

### 10.
Ketika subclass menulis ulang method dari superclass dengan nama dan parameter yang sama, itu disebut:

A. Importing  
B. Overriding  
C. Overloading  
D. Packaging

**Penjelasan:**  
Overriding dipakai untuk menyesuaikan perilaku method dari induk.

### 11.
Method `static` biasanya dipanggil:

A. Tanpa membuat object terlebih dahulu  
B. Hanya lewat object  
C. Hanya di constructor  
D. Hanya di interface

**Penjelasan:**  
Method static milik class, bukan milik object tertentu.

### 12.
Di dalam constructor, keyword `this` biasanya digunakan untuk:

A. Membuat package baru  
B. Menghapus object lama  
C. Memanggil method static  
D. Membedakan field class dan parameter

**Penjelasan:**  
`this` membantu membedakan atribut class dari nama parameter yang sama.

### 13.
Jika sebuah kelas `Nilai` menyimpan beberapa object `MataKuliah` dalam sebuah array, maka konsep yang paling dekat adalah:

A. Array of primitives  
B. Array of objects  
C. Inheritance tunggal  
D. Polymorphism murni

**Penjelasan:**  
Array tersebut berisi referensi ke object, bukan sekadar nilai biasa.

### 14.
Class `Mobil` memiliki object `Mesin` sebagai bagian di dalamnya. Hubungan ini disebut:

A. Overloading  
B. Inheritance  
C. Composition  
D. Interface

**Penjelasan:**  
Composition menunjukkan object tersusun dari object lain.

### 15.
Kode berikut paling cocok untuk membaca input dari keyboard:

A. `Scanner sc = new Scanner(System.in);`  
B. `System.out.println("Nama");`  
C. `Integer.parseInt();`  
D. `Math.random();`

**Penjelasan:**  
`Scanner` adalah class umum untuk input dari pengguna.

### 16.
Method berikut:

```java
double hitung() {
    return 3.5;
}
```

Termasuk method yang:

A. Tidak memiliki parameter  
B. Tidak bisa dipanggil  
C. Bersifat abstrak  
D. Mengembalikan nilai

**Penjelasan:**  
Kata kunci `return` menandakan method memberi hasil kembali.

### 17.
Pernyataan yang paling tepat tentang `package` di Java adalah:

A. Tempat menyimpan nilai variable  
B. Pengelompokan class agar rapi  
C. Nama khusus untuk object  
D. Tipe data boolean

**Penjelasan:**  
Package dipakai untuk mengorganisasi class dalam proyek.

### 18.
Class yang tidak boleh dibuat object langsung, tetapi dipakai sebagai dasar class lain, disebut:

A. Abstract class  
B. Final class  
C. Utility class  
D. Inner class

**Penjelasan:**  
Abstract class biasanya digunakan untuk kerangka perilaku umum.

### 19.
Interface pada Java paling tepat digunakan untuk:

A. Menyimpan data mahasiswa  
B. Menyembunyikan field privat  
C. Mendefinisikan kontrak method  
D. Mengganti semua class

**Penjelasan:**  
Interface berisi kontrak perilaku yang harus diikuti class implementasinya.

### 20.
Constructor default adalah constructor yang:

A. Selalu menerima tiga parameter  
B. Hanya ada pada class abstrak  
C. Tidak pernah dipanggil  
D. Tidak diberi parameter

**Penjelasan:**  
Constructor tanpa parameter sering dipakai sebagai constructor default.

### 21.
Jika field sebuah class dibuat `private`, cara yang paling tepat untuk mengakses nilainya dari luar class adalah melalui:

A. `break`  
B. Getter method  
C. `switch`  
D. `for` loop

**Penjelasan:**  
Getter menjaga prinsip encapsulation tetap rapi.

### 22.
Perhatikan method berikut:

```java
void cetak(String nama)
```

Bagian `String nama` disebut:

A. Parameter method  
B. Return type  
C. Object identifier  
D. Package name

**Penjelasan:**  
Parameter adalah data yang dikirim ke method saat dipanggil.

### 23.
Pernyataan yang benar tentang keyword `new` adalah:

A. Dipakai untuk memanggil constructor  
B. Dipakai untuk menghapus object  
C. Dipakai untuk mendeklarasikan package  
D. Dipakai untuk membuat array dua dimensi saja

**Penjelasan:**  
`new` memicu proses pembuatan object dan pemanggilan constructor.

### 24.
Keyword `super` digunakan untuk:

A. Memanggil method di class yang sama  
B. Membuat object baru  
C. Mengakses array  
D. Mengacu ke class induk

**Penjelasan:**  
`super` dipakai ketika ingin mengakses bagian dari superclass.

### 25.
Jika sebuah variabel diberi modifier `final`, artinya:

A. Nilainya harus selalu null  
B. Nilainya tidak bisa diubah lagi  
C. Variabel hanya bisa dipakai di loop  
D. Variabel otomatis menjadi static

**Penjelasan:**  
`final` menandakan nilai tetap setelah diinisialisasi.

### 26.
Method yang tugasnya mengembalikan nilai field class ke pemanggil biasanya disebut:

A. Getter  
B. Setter  
C. Constructor  
D. Destructor

**Penjelasan:**  
Getter dipakai untuk membaca nilai atribut dengan aman.

### 27.
Method yang digunakan untuk mengubah isi field class disebut:

A. Getter  
B. Print method  
C. Setter  
D. Main method

**Penjelasan:**  
Setter dipakai untuk memberi atau memperbarui nilai atribut.

### 28.
Jika sebuah array `nilai` memiliki 5 elemen, maka indeks terakhirnya adalah:

A. 0  
B. 1  
C. 4  
D. 5

**Penjelasan:**  
Indeks array Java dimulai dari 0, sehingga elemen kelima berada di indeks 4.

### 29.
Class `Buku` memiliki dua constructor:

```java
Buku() { }
Buku(String judul) { }
```

Contoh tersebut menunjukkan:

A. Constructor overloading  
B. Constructor overriding  
C. Polymorphism interface  
D. Composition

**Penjelasan:**  
Constructor dengan nama sama tetapi parameter berbeda merupakan overloading.

### 30.
Method `main` dalam program Java berfungsi sebagai:

A. Class turunan  
B. Titik awal eksekusi program  
C. Penyimpan data global  
D. Constructor utama

**Penjelasan:**  
Program Java umumnya mulai berjalan dari method `main`.
