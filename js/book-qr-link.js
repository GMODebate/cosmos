(function(doc) {

    var addEventListenerSupported = (doc.addEventListener);
    
        
        function GET_QR(qrOptions, maxTypeNumber, callback, qrCode, tetry) {
            retry = true;
            while (retry) {
                if (typeof QRCodeStyling === 'undefined') {
                    return setTimeout(function() {
                        GET_QR(qrOptions, maxTypeNumber, callback, qrCode, tetry);
                    }, 1);
                }
                try {
                    qrCode = new QRCodeStyling(
                        qrOptions
                    );
                    retry = false;
                } catch (err) {
                    qrOptions.qrOptions.typeNumber++;
                    qrOptions.qrOptions.typeNumber++;
    
                    if (qrOptions.qrOptions.typeNumber > maxTypeNumber) {
                        throw err;
                    }
                }
            }
            callback(qrCode);
        }
    
      function addEvent(trigger, handler, el, options) {
        try {
            el = el || document;
            options = (options === -1) ? { passive: true, once: true } : options;
    
            if (Array.isArray(trigger)) {
                trigger.forEach(_trigger => addEvent(_trigger, handler, el, options));
            } else {
                el = (!Array.isArray(el) && !(el instanceof NodeList)) ? [el] : el;
    
            el.forEach(_el => {
                if (addEventListenerSupported) {
                    let passive = ['touchstart'].includes(trigger);
                    _el.addEventListener(trigger, handler, passive ? Object.assign({ passive: true }, options || {}) : (options || false));
                } else if (_el.attachEvent) {
                    if (trigger === 'DOMContentLoaded') { trigger = 'load'; _el = window; }
                    _el.attachEvent('on' + trigger, handler);
                } else { try { _el['on' + trigger] = handler; } catch (e) {} }
            });
        }
    
        return () => removeEvent(trigger, handler, el);
        } catch (e) { console.error(e); }
    }
    
    var ebookqr = document.getElementById('ebook-qr');
    
      function load_qr() {

        requestAnimationFrame(function() {

            GET_QR({
                "width": 400,
                "height": 400,
                "data": ebookqr.getAttribute('href'),
                "margin": 0,
                "qrOptions": {
                    "typeNumber": "4",
                    "mode": "Byte",
                    "errorCorrectionLevel": "Q"
                },
                "imageOptions": {
                    "hideBackgroundDots": true,
                    "imageSize": 0.4,
                    "margin": 0
                },
                "dotsOptions": {
                    "type": "square",
                    "color": "#000000"
                },
                "backgroundOptions": {
                    "color": "#ffffff"
                },
                //"image": "/images/book-qr-download.png",
                "dotsOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#6a1a4c",
                        "color2": "#6a1a4c",
                        "rotation": "0"
                    }
                },
                "cornersSquareOptions": {
                    "type": "",
                    "color": "#000000"
                },
                "cornersSquareOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#000000",
                        "color2": "#000000",
                        "rotation": "0"
                    }
                },
                "cornersDotOptions": {
                    "type": "",
                    "color": "#000000"
                },
                "cornersDotOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#000000",
                        "color2": "#000000",
                        "rotation": "0"
                    }
                },
                "backgroundOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#ffffff",
                        "color2": "#ffffff",
                        "rotation": "0"
                    }
                },
                imageOptions: {
                    margin: 20
                }
            }, 30, function(qr) {
                document.getElementById('qr').innerHTML = '';
                qr.append(document.getElementById('qr'));
    
            });
    });
      }
    
      load_qr();
    
    })(document);