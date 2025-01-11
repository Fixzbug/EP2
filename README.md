# **Docker Cleanup and Deployment Steps for AWS Node.js + MySQL Project**

---

## **General Docker Cleanup Commands**

### 1. **Stop and Rebuild Containers**
To stop and rebuild the containers:
```bash
sudo docker compose down
sudo docker compose up --build
```

---

### 2. **Remove Specific Containers**
To remove a specific container:
```bash
sudo docker rm <container_id>
```

---

### 3. **List Recent Containers and Images**
- **List the most recently created container**:
  ```bash
  sudo docker container ls -l
  ```
- **List the most recently created image**:
  ```bash
  sudo docker image ls -l
  ```

---

## **Removing Unused Docker Resources**

### 4. **Remove Exited Containers**
To remove all containers with a status of "exited":
```bash
sudo docker rm $(docker ps -aq -f status=exited)
```

---

### 5. **Remove Dangling Images**
Dangling images are unused images without any tags:
```bash
sudo docker image prune -a
```

---

### 6. **Clear Unused Volumes**
To remove all unused volumes:
```bash
sudo docker volume prune
```

---

### 7. **Remove Unused Networks**
To clear unused Docker networks:
```bash
sudo docker network prune
```

---

### 8. **Remove Everything Unused**
To clear all unused Docker data, including images, containers, volumes, and networks:
```bash
sudo docker system prune -a --volumes
```

---

## **Steps to Reset and Deploy the Project**

### **Step-by-Step Instructions**
1. **Pull the Latest Changes from Git**:
   ```bash
   git pull
   ```

2. **Clean Up Docker Resources**:
   Remove all unused Docker containers, images, volumes, and networks:
   ```bash
   sudo docker system prune -a --volumes
   ```

3. **Delete the Existing MySQL Data**:
   Remove the database directory to reset MySQL data:
   ```bash
   sudo rm -rf ./db-data
   ```

4. **Rebuild and Start Docker Containers**:
   Use the following command to build and start the containers:
   ```bash
   sudo docker compose up --build
   ```

---

### **Final Notes**
- These steps ensure a clean environment for your **Node.js** and **MySQL** Docker application.
- If you are resetting the database, **back up critical data** before deleting `./db-data`.

---

### **Summary of Key Commands**

| Task                          | Command                                     |
|-------------------------------|---------------------------------------------|
| Stop and rebuild containers   | `sudo docker compose down && sudo docker compose up --build` |
| Remove exited containers      | `sudo docker rm $(docker ps -aq -f status=exited)` |
| Prune unused images           | `sudo docker image prune -a`               |
| Prune unused volumes          | `sudo docker volume prune`                 |
| Prune unused networks         | `sudo docker network prune`                |
| Full system cleanup           | `sudo docker system prune -a --volumes`    |
| Reset MySQL data              | `sudo rm -rf ./db-data`                    |

By following these steps, you will have a fresh deployment of your Dockerized Node.js and MySQL environment on AWS. 🚀


การทำให้เว็บ **Node.js** ของคุณทำงานผ่าน **HTTPS** สามารถทำได้โดยการใช้ **SSL/TLS Certificates** บน Express และตั้งค่าเซิร์ฟเวอร์ให้รองรับ HTTPS โดยมีขั้นตอนดังนี้:

---

## **1. สร้างหรือขอ SSL/TLS Certificate**
มีสองวิธีหลัก:
1. **ใช้ Self-Signed Certificate** (สำหรับพัฒนาระบบภายใน)
   - ใช้ `openssl` สร้างไฟล์ `.key` และ `.crt` สำหรับเซิร์ฟเวอร์:
     ```bash
     openssl req -nodes -new -x509 -keyout server.key -out server.crt
     ```
   - ทำตามคำถามที่แสดง เช่น ชื่อโดเมน (Common Name) และข้อมูลอื่น ๆ  
     ไฟล์ที่ได้:
     - `server.key` - Private Key  
     - `server.crt` - Certificate  

2. **ใช้ CA Certificate** (สำหรับ Production)
   - ขอใบรับรอง SSL จาก **Let's Encrypt** หรือผู้ให้บริการเช่น **DigiCert**, **GoDaddy**  
     เครื่องมือที่นิยมใช้: [Certbot](https://certbot.eff.org/)

---

## **2. ติดตั้งไฟล์ Certificate ใน Node.js**
แก้ไขไฟล์ **`index.js`** ให้รองรับ HTTPS:

### เพิ่ม HTTPS Module และโหลด Certificate Files
```javascript
const https = require('https'); // HTTPS module
const fs = require('fs'); // File System module
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Load SSL Certificates
const options = {
  key: fs.readFileSync('./certs/server.key'), // Path to private key
  cert: fs.readFileSync('./certs/server.crt') // Path to certificate
};

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send(`Hello World! Secure version ${process.env.APP_VERSION || '1.0.0'}`);
});

app.get('/attractions', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM attractions");
    res.json(rows);
  } catch (err) {
    console.error("Database error: ", err.message);
    res.status(500).json({ error: "Database query failed" });
  }
});

// Graceful Shutdown
process.on('SIGINT', () => {
  pool.end(() => {
    console.log("Database connection pool closed.");
    process.exit(0);
  });
});

// Start HTTPS Server
https.createServer(options, app).listen(port, () => {
  console.log(`App listening securely at https://localhost:${port}`);
});
```

---

## **3. อัพเดท Docker Compose ให้ใช้ SSL Certificates**
ปรับให้ Docker สามารถเข้าถึงไฟล์ SSL (`server.key` และ `server.crt`) โดยใช้ **volumes**:

แก้ไขไฟล์ `docker-compose.yml`:

```yaml
version: "3.8"

services:
  db:
    image: mysql:8.0.33
    environment:
      MYSQL_ROOT_PASSWORD: P@ssword1234
      MYSQL_DATABASE: test
      MYSQL_USER: makerz
      MYSQL_PASSWORD: P@ssword1234
    volumes:
      - ./init-db:/docker-entrypoint-initdb.d
      - ./db-data:/var/lib/mysql
    ports:
      - '3306:3306'
    networks:
      - mynetwork

  api:
    build: .
    environment:
      DB_HOST: db
      DB_USER: makerz
      DB_PASSWORD: P@ssword1234
      DB_DATABASE: test
    ports:
      - '443:5000' # Map HTTPS port to the container's port
    volumes:
      - ./certs:/app/certs # Mount SSL certificates into the container
    depends_on:
      - db
    networks:
      - mynetwork

networks:
  mynetwork:
    driver: bridge
```

---

## **4. ทดสอบ HTTPS**
1. สร้างโฟลเดอร์ `certs` ในโปรเจกต์ของคุณ และวางไฟล์:
   - `server.key`
   - `server.crt`

2. รันคำสั่ง:
   ```bash
   sudo docker compose down
   sudo docker compose up --build
   ```

3. เปิดเบราว์เซอร์แล้วไปที่:
   ```
   https://localhost
   ```
   **Note:** หากใช้ Self-Signed Certificate จะมีคำเตือน "untrusted certificate" ในเบราว์เซอร์ ซึ่งถือว่าปกติสำหรับ local development.

---

## **5. สำหรับ Production**
- ใช้ **Let's Encrypt** และ reverse proxy เช่น **NGINX** หรือ **Traefik** เพื่อรองรับ HTTPS โดยไม่ต้องปรับโค้ด Node.js
- ติดตั้ง Certbot บนเซิร์ฟเวอร์เพื่อขอและต่ออายุใบรับรอง SSL อัตโนมัติ.

---

### **สรุป**
1. สร้าง SSL Certificate (`server.key`, `server.crt`)
2. ปรับโค้ด Node.js ให้รองรับ HTTPS
3. แก้ไข `docker-compose.yml` ให้ Mount ไฟล์ SSL และเปิด HTTPS Port (443)
4. ใช้ **NGINX** หรือ **Let's Encrypt** สำหรับ Production

หากติดปัญหาเพิ่มเติม แจ้งมาได้เลยครับ! 🚀