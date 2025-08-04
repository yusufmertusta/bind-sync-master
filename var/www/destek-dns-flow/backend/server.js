const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DNS Backend API is running' });
});

// Zone listeleme endpoint
app.get('/api/zones', (req, res) => {
  fs.readdir(ZONE_DIR, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Zone dizini okunamadı' });
    }
    
    const zones = files
      .filter(file => file.endsWith('.zone'))
      .map(file => ({
        name: file.replace('.zone', ''),
        file: file,
        path: path.join(ZONE_DIR, file)
      }));
    
    res.json({ zones });
  });
});

// Zone oluşturma endpoint
app.post('/api/zones', (req, res) => {
  const { name, type = 'master' } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Zone adı gerekli' });
  }
  
  const zoneFile = path.join(ZONE_DIR, `${name}.zone`);
  const zoneContent = `$TTL 300
@   IN  SOA ${name}. admin.${name}. (
    2024010101  ; Serial
    3600        ; Refresh
    1800        ; Retry
    604800      ; Expire
    300         ; Minimum TTL
)
@   IN  NS  ns1.${name}.
@   IN  A   192.168.0.189
`;

  fs.writeFile(zoneFile, zoneContent, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Zone dosyası oluşturulamadı' });
    }
    
    // named.conf.local dosyasına zone ekle
    const namedConfEntry = `
zone "${name}" {
    type master;
    file "${zoneFile}";
};
`;
    
    fs.appendFile(NAMED_CONF, namedConfEntry, (err) => {
      if (err) {
        return res.status(500).json({ error: 'named.conf.local güncellenemedi' });
      }
      
      exec('sudo systemctl reload bind9', (error) => {
        if (error) {
          return res.status(500).json({ error: 'Bind9 yeniden yüklenemedi' });
        }
        res.json({ success: true, message: 'Zone oluşturuldu', zone: { name, type } });
      });
    });
  });
});

// Bind9 zone dosyası yolu
const ZONE_DIR = '/etc/bind/zones/';
const NAMED_CONF = '/etc/bind/named.conf.local';

// DNS kaydı ekleme
app.post('/api/dns/add-record', (req, res) => {
  const { domain, type, name, value, ttl = 300 } = req.body;

  const zoneFile = path.join(ZONE_DIR, `${domain}.zone`);
  const record = `${name}\t${ttl}\tIN\t${type}\t${value}\n`;

  fs.appendFile(zoneFile, record, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Zone dosyasına yazılamadı' });
    }

    // Bind9'u yeniden yükle
    exec('sudo systemctl reload bind9', (error) => {
      if (error) {
        return res.status(500).json({ error: 'Bind9 yeniden yüklenemedi' });
      }
      res.json({ success: true, message: 'DNS kaydı eklendi' });
    });
  });
});

// DNS kaydı silme
app.delete('/api/dns/delete-record', (req, res) => {
  const { domain, name, type } = req.body;

  const zoneFile = path.join(ZONE_DIR, `${domain}.zone`);

  fs.readFile(zoneFile, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Zone dosyası okunamadı' });
    }

    const lines = data.split('\n');
    const filteredLines = lines.filter(line =>
      !line.includes(`${name}\t`) || !line.includes(`\t${type}\t`)
    );

    fs.writeFile(zoneFile, filteredLines.join('\n'), (err) => {
      if (err) {
        return res.status(500).json({ error: 'Zone dosyasına yazılamadı' });
      }

      exec('sudo systemctl reload bind9', (error) => {
        if (error) {
          return res.status(500).json({ error: 'Bind9 yeniden yüklenemedi' });
        }
        res.json({ success: true, message: 'DNS kaydı silindi' });
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`DNS Backend API ${PORT} portunda çalışıyor`);
});