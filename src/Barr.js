import React, { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';
import './BarcodeScanner.css';

const BarcodeScanner = () => {
  const [scannedItems, setScannedItems] = useState([]);
  const [lastScanned, setLastScanned] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const scannerRef = useRef(null);

  const startScanner = () => {
    // Request camera permissions first for better mobile experience
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
      } 
    })
    .then(stream => {
      // Stop the stream immediately, Quagga will request it again
      stream.getTracks().forEach(track => track.stop());
      
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: scannerRef.current,
          constraints: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          },
        },
        locate: true,
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "code_128_reader", "upc_reader"],
          debug: {
            drawBoundingBox: true,
            showPattern: true,
          }
        },
        frequency: 10
      }, (err) => {
        if (err) {
          console.error("Error iniciando el escáner:", err);
          alert("No se pudo acceder a la cámara. Por favor, permite el acceso.");
          return;
        }
        Quagga.start();
        setIsScanning(true);
      });
    })
    .catch(err => {
      console.error("Error solicitando permisos de cámara:", err);
      alert("No se pudo acceder a la cámara. Por favor, permite el acceso.");
    });

    let lastResult = null;
    let sameResultCount = 0;

    Quagga.onDetected((result) => {
      let code = result.codeResult.code;
      if (code.length !== 13 && code.length !== 8) return;

      // Remove first "00" if code starts with two consecutive "00"
      if (code.startsWith('00')) {
        code = code.substring(2);
      }

      if (code === lastResult) {
        sameResultCount++;
        if (sameResultCount >= 3) {
          setLastScanned(code);
          setScannedItems(prev => {
            if (!prev.some(item => item.code === code)) {
              return [...prev, { code, id: Date.now() }];
            }
            return prev;
          });
          
          // Show success animation for 2 seconds
          setShowSuccessAnimation(true);
          setTimeout(() => {
            setShowSuccessAnimation(false);
          }, 2000);
          
          stopScanner();
          sameResultCount = 0;
        }
      } else {
        sameResultCount = 1;
        lastResult = code;
      }
    });
  };

  const stopScanner = () => {
    Quagga.stop();
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (isScanning) {
        Quagga.stop();
      }
    };
  }, [isScanning]);

  const copyToClipboard = () => {
    const text = scannedItems.map(item => item.code).join(',');
    navigator.clipboard.writeText(text).then(() => {
      alert("Lista copiada al portapapeles");
    }).catch(err => console.error("Error al copiar:", err));
  };

  const downloadAsTextFile = () => {
    const text = scannedItems.map(item => item.code).join(',');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `codigos_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scanner-container">
      <button 
        onClick={isScanning ? stopScanner : startScanner}
        className={`scanner-button ${isScanning ? 'stop' : 'start'}`}
      >
        {isScanning ? '⏹️ Detener' : '📷 Escanear'}
      </button>

      <button 
        onClick={copyToClipboard}
        disabled={scannedItems.length === 0}
        className="copy-button"
      >
        📋 Copiar Lista
      </button>

      <button 
        onClick={downloadAsTextFile}
        disabled={scannedItems.length === 0}
        className="download-button"
      >
        💾 Descargar TXT
      </button>

      <div ref={scannerRef} className={`scanner-view ${isScanning ? 'active' : ''}`}>
        <div className="scanner-line"/>
      </div>

      {showSuccessAnimation && (
        <div className="success-animation">
          <div className="success-checkmark">✓</div>
          <p>¡Código escaneado!</p>
        </div>
      )}

      {lastScanned && (
        <div className="last-scanned">
          <p className="label">Último escaneado:</p>
          <p className="code">{lastScanned}</p>
        </div>
      )}

      <div className="scanned-list">
        {scannedItems.map((item) => (
          <div key={item.id} className="scanned-item">
            {item.code}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarcodeScanner;
